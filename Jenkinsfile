pipeline {
    // Используем любой доступный агент, на котором установлен Docker
    agent any

    // Определяем переменные окружения
    environment {
        // Укажите здесь публичный адрес вашего Staging-сервера
        E2E_BASE_URL = 'http://localhost:4400' 
    }

    stages {
        // --- 1. Запуск E2E-тестов ---
        stage('Run E2E Tests') {
            steps {
                echo "Running Playwright E2E Tests against ${env.E2E_BASE_URL}..."
                
                // Используем withCredentials для безопасного предоставления токена.
                withCredentials([string(
                    credentialsId: 'PLAYWRIGHT_CI_AUTH_TOKEN', // ID ваших учетных данных
                    variable: 'PLAYWRIGHT_AUTH_TOKEN'          // Имя переменной, которая будет доступна в Shell
                )]) {
                    // Используем Docker для создания изолированной среды тестирования
                    sh """
                    docker run --rm \\
                        -v \$(pwd):/app \\
                        -w /app \\
                        -e PLAYWRIGHT_BASE_URL=${env.E2E_BASE_URL} \\
                        // Передаем секретный токен в контейнер как переменную окружения
                        -e PLAYWRIGHT_AUTH_TOKEN=${PLAYWRIGHT_AUTH_TOKEN} \\
                        // Используем официальный образ Playwright, в котором уже есть Node.js и все браузеры
                        mcr.microsoft.com/playwright/node:lts-slim /bin/bash -c "
                        
                        echo 'Installing npm dependencies...'
                        // Установка зависимостей (используйте 'npm ci' для CI)
                        npm ci
                        
                        echo 'Starting Playwright tests...'
                        // Запуск тестов. Обязательно укажите здесь правильные команды для вашего проекта.
                        npx playwright test --project=chromium
                        "
                    """
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
