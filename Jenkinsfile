pipeline {
    // Используем любой доступный агент, на котором установлен Docker
    agent any

    // Определяем переменные окружения
    environment {
        // Укажите здесь публичный адрес вашего Staging-сервера
        E2E_BASE_URL = 'http://localhost:4400' 
        // Определяем полный путь к исполняемому файлу Docker для macOS/Linux.
        DOCKER_CLI_PATH = '/usr/local/bin/docker'
        // ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ ТЕГА: Используем максимально стабильный и специфичный тег (Node 20 на Jammy)
        DOCKER_IMAGE = 'mcr.microsoft.com/playwright/node:20-jammy'
    }

    stages {
        // --- 1. Запуск E2E-тестов ---
        stage('Run E2E Tests') {
            steps {
                echo "Running Playwright E2E Tests against ${env.E2E_BASE_URL}..."
                
                // Предварительно загружаем Docker-образ, чтобы избежать проблем с docker-credential-desktop
                sh label: 'Pre-pull Docker Image', script: """
                    ${DOCKER_CLI_PATH} pull ${DOCKER_IMAGE}
                """
                
                // Используем withCredentials для безопасного предоставления токена PLAYWRIGHT_CI_AUTH_TOKEN.
                withCredentials([string(
                    credentialsId: 'PLAYWRIGHT_CI_AUTH_TOKEN', // ID ваших учетных данных
                    variable: 'PLAYWRIGHT_AUTH_TOKEN'          // Имя переменной, которая будет доступна в Shell
                )]) {
                    // Используем Docker для создания изолированной среды тестирования
                    sh label: 'Run E2E Tests in Docker', script: '''
                    ${DOCKER_CLI_PATH} run --rm \\
                        -v "$(pwd):/app" \\
                        -w /app \\
                        -e PLAYWRIGHT_BASE_URL=''' + env.E2E_BASE_URL + ''' \\
                        -e PLAYWRIGHT_AUTH_TOKEN=\"''' + PLAYWRIGHT_AUTH_TOKEN + '''\" \\
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

    // Обработка результатов пайплайна
    post {
        always {
            echo "Pipeline finished. Status: ${currentBuild.result}"
        }
        success {
            echo 'E2E Tests PASSED!'
        }
        failure {
            echo 'E2E Tests FAILED! Check console output for errors.'
        }
    }
}
