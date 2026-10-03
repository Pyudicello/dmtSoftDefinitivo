package com.prevenia.assignment.application;

import com.prevenia.assignment.api.dto.TechnicianSummaryDto;
import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.shared.domain.DuplicateResourceException;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.InvalidAssignmentException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final UserCompanyAssignmentRepository assignmentRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void assignTechnician(UUID companyId, UUID userId, AuthenticatedUser caller) {
        log.debug("Assigning technician {} to company {} by {}", userId, companyId, caller.getEmail());

        if (caller.isTechnician() || caller.isClient()) {
            throw new ForbiddenException("Technicians and clients cannot assign technicians");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (caller.isConsultantAdmin() && !company.getOrganizationId().equals(caller.getOrganizationId())) {
            log.warn("Consultant admin {} tried to assign technician to company {} of another organization",
                    caller.getEmail(), companyId);
            throw new ResourceNotFoundException("Company", companyId);
        }

        UUID targetOrgId = company.getOrganizationId();

        User user = userRepository.findByIdAndOrganizationId(userId, targetOrgId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getRole() != UserRole.TECHNICIAN) {
            log.warn("Cannot assign user {} with role {} as technician", userId, user.getRole());
            throw new InvalidAssignmentException("Only users with role TECHNICIAN can be assigned to companies");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidAssignmentException("Cannot assign an inactive or blocked technician");
        }

        var existingAssignmentOpt = assignmentRepository
                .findByOrganizationIdAndUserIdAndCompanyId(targetOrgId, userId, companyId);

        if (existingAssignmentOpt.isPresent()) {
            UserCompanyAssignment assignment = existingAssignmentOpt.get();
            if (assignment.isActive()) {
                throw new DuplicateResourceException("Technician is already assigned to this company");
            }
            assignment.setActive(true);
            assignment.setAssignedAt(OffsetDateTime.now(ZoneOffset.UTC));
            assignmentRepository.save(assignment);
        } else {
            UserCompanyAssignment assignment = UserCompanyAssignment.builder()
                    .organizationId(targetOrgId)
                    .userId(userId)
                    .companyId(companyId)
                    .assignedAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .active(true)
                    .build();
            assignmentRepository.save(assignment);
        }

        log.info("Technician {} successfully assigned to company {} in org {} by {}",
                user.getEmail(), company.getBusinessName(), targetOrgId, caller.getEmail());
    }

    @Transactional
    public void unassignTechnician(UUID companyId, UUID userId, AuthenticatedUser caller) {
        log.debug("Unassigning technician {} from company {} by {}", userId, companyId, caller.getEmail());

        if (caller.isTechnician() || caller.isClient()) {
            throw new ForbiddenException("Technicians and clients cannot unassign technicians");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (caller.isConsultantAdmin() && !company.getOrganizationId().equals(caller.getOrganizationId())) {
            throw new ResourceNotFoundException("Company", companyId);
        }

        UUID targetOrgId = company.getOrganizationId();

        UserCompanyAssignment assignment = assignmentRepository
                .findByOrganizationIdAndUserIdAndCompanyId(targetOrgId, userId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", companyId + "/" + userId));

        if (!assignment.isActive()) {
            throw new ResourceNotFoundException("Assignment", companyId + "/" + userId);
        }

        assignment.setActive(false);
        assignmentRepository.save(assignment);

        log.info("Technician {} unassigned from company {} by {}", userId, companyId, caller.getEmail());
    }

    @Transactional(readOnly = true)
    public List<TechnicianSummaryDto> getAssignedTechnicians(UUID companyId, AuthenticatedUser caller) {
        log.debug("Listing assigned technicians for company {} by {}", companyId, caller.getEmail());

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (caller.isConsultantAdmin() && !company.getOrganizationId().equals(caller.getOrganizationId())) {
            throw new ResourceNotFoundException("Company", companyId);
        }

        if (caller.isTechnician()) {
            boolean isAssigned = assignmentRepository
                    .existsByOrganizationIdAndUserIdAndCompanyIdAndActiveTrue(caller.getOrganizationId(), caller.getUserId(), companyId);
            if (!isAssigned) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        }

        if (caller.isClient()) {
            if (caller.getCompanyId() == null || !caller.getCompanyId().equals(companyId)) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        }

        List<UserCompanyAssignment> assignments = assignmentRepository
                .findAllByOrganizationIdAndCompanyIdAndActiveTrue(company.getOrganizationId(), companyId);

        if (assignments.isEmpty()) {
            return List.of();
        }

        List<UUID> userIds = assignments.stream().map(UserCompanyAssignment::getUserId).toList();
        Map<UUID, User> usersMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return assignments.stream()
                .map(assignment -> {
                    User user = usersMap.get(assignment.getUserId());
                    return TechnicianSummaryDto.builder()
                            .userId(assignment.getUserId())
                            .firstName(user != null ? user.getFirstName() : "")
                            .lastName(user != null ? user.getLastName() : "")
                            .email(user != null ? user.getEmail() : "")
                            .assignedAt(assignment.getAssignedAt())
                            .active(assignment.isActive())
                            .build();
                })
                .toList();
    }
}
