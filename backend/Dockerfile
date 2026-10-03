# ==========================================================
# Stage 1: Build
# ==========================================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM first for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build package
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ==========================================================
# Stage 2: Runtime
# ==========================================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Create non-root system user
RUN addgroup -S prevenia && adduser -S prevenia -G prevenia

# Copy jar from builder stage
COPY --from=builder --chown=prevenia:prevenia /app/target/prevenia-backend-0.1.0-SNAPSHOT.jar app.jar

USER prevenia

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
