pipeline {
    agent any

    environment {
        E2E_BASE_URL = 'https://mn.fcs.baimly.dev'
        DOCKER_CLI_PATH = '/usr/local/bin/docker'
        DOCKER_IMAGE = 'mcr.microsoft.com/playwright:v1.55.0-jammy' // стабильный playwright-образ
    }

    stages {
        stage('Run E2E Tests') {
            steps {
                echo "🚀 Running Playwright E2E Tests against ${env.E2E_BASE_URL}..."

                // Предзагрузка Docker-образа (ускоряет билд)
                sh label: 'Pre-pull Docker Image', script: """
                    ${DOCKER_CLI_PATH} pull ${DOCKER_IMAGE}
                """

                // 🔐 Используем Secret File
                withCredentials([file(credentialsId: 'PLAYWRIGHT_CI_AUTH_FILE', variable: 'AUTH_FILE')]) {
                    sh label: 'Run Playwright Tests in Docker', script: """
                        ${DOCKER_CLI_PATH} run --rm \\
                            -v "\$(pwd):/app" \\
                            -w /app \\
                            -e PLAYWRIGHT_BASE_URL=${E2E_BASE_URL} \\
                            -e CI_AUTH_PATH="/app/tests/auth/ci-auth-long-life.json" \\
                            ${DOCKER_IMAGE} /bin/bash -c "
                                echo '📦 Installing npm dependencies...'
                                npm ci

                                echo '🔐 Copying auth file into container...'
                                cp \$AUTH_FILE /app/tests/auth/ci-auth-long-life.json

                                echo '▶️ Starting Playwright tests...'
                                npx playwright test --project=chromium
                            "
                    """
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Status: ${currentBuild.result}"
        }
        success {
            echo '✅ E2E Tests PASSED!'
        }
        failure {
            echo '❌ E2E Tests FAILED! Check console output for errors.'
        }
    }
}
