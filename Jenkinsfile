pipeline {
    agent any

    environment {
        E2E_BASE_URL = 'http://localhost:4400'
        DOCKER_CLI_PATH = '/usr/local/bin/docker'

        // ✅ Новый стабильный Playwright-образ (вместо node:20-jammy)
        // Проверено: доступен и поддерживается в 2025 году
        DOCKER_IMAGE = 'mcr.microsoft.com/playwright:v1.55.0-jammy'

    }

    stages {
        stage('Run E2E Tests') {
            steps {
                echo "Running Playwright E2E Tests against ${env.E2E_BASE_URL}..."
                
                // Предзагрузка образа, чтобы не было таймаутов
                sh label: 'Pre-pull Docker Image', script: """
                    ${DOCKER_CLI_PATH} pull ${DOCKER_IMAGE}
                """

                withCredentials([string(
                    credentialsId: 'PLAYWRIGHT_CI_AUTH_TOKEN',
                    variable: 'PLAYWRIGHT_AUTH_TOKEN'
                )]) {
                    sh label: 'Run E2E Tests in Docker', script: '''
                    ${DOCKER_CLI_PATH} run --rm \
                        -v "$(pwd):/app" \
                        -w /app \
                        -e PLAYWRIGHT_BASE_URL=''' + env.E2E_BASE_URL + ''' \
                        -e PLAYWRIGHT_AUTH_TOKEN="''' + PLAYWRIGHT_AUTH_TOKEN + '''" \
                        ''' + DOCKER_IMAGE + ''' /bin/bash -c "
                        
                        echo 'Installing npm dependencies...'
                        npm ci
                        
                        echo 'Starting Playwright tests...'
                        npx playwright test --project=chromium
                        "
                    '''
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
