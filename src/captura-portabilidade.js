const { delay } = require("./helper")

async function loginMartim({ page, username, password }) {
    return new Promise(async (resolve, reject) => {
        try {
            await page.goto('https://capgeminibr.service-now.com/tim')
            // await page.waitForNavigation({timeout: 60000})

            const inputUsername = await page.$('#username')
            await inputUsername.type(username, { delay: 100 })

            const inputPassword = await page.$('#password')
            await inputPassword.type(password, { delay: 100 })

            const btnLogin = await page.$('button[type="submit"]')
            await btnLogin.click()

            await page.waitForNavigation({ timeout: 60000 })
            console.log('Login realizado')
            resolve(true)
        } catch (error) {
            console.log('ERRO_PREENCHIMENTO_LOGIN:', error)
            reject(error)
        }
    })
}

async function capturarDados({ page, cliente }) {
    return new Promise(async (resolve, reject) => {
        try {

            //* Inserir a linha no input
            const inputLinha = await page.$("input[type='number'].cap-text-input")

            await page.evaluate((linha, input) => {
                // devTools
                input.value = linha;
                const event = new Event('change')
                input.dispatchEvent(event);

                const injector = angular.element(document.body).injector();
                const rootScope = injector.get('$rootScope');
                const scope = angular.element(document.querySelector('.btn-search')).scope();

                //* Buscar 
                scope.c.consultaPortabilidade(scope.c.data.linha)
                return

            }, cliente.gsm, inputLinha)

            //* Aguardar a busca
            await delay(400)
            await page.waitForSelector('span img.timLoader', { hidden: true, timeout: 60000 });

            // Capturar e retornar os dados
            const data = await page.evaluate(() => {
                let data = {
                    status: undefined,
                    motivo: undefined,
                    acao: undefined,
                }

                const trs = document.querySelectorAll('table tbody tr')
                Array.from(trs).forEach(tr => {
                    const td1 = tr.querySelector('td:nth-child(1)')
                    const td2 = tr.querySelector('td:nth-child(2)')
                    if (td1.textContent === 'STATUS DA PORTABILIDADE:') {
                        data.status = td2.textContent
                    }
                    if (td1.textContent === 'MOTIVO:') {
                        data.motivo = td2.textContent
                    }
                    if (td1.textContent === 'AÇÃO:') {
                        data.acao = td2.textContent
                    }
                })
                return data;
            })

            resolve({...cliente, ...data})
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    loginMartim,
    capturarDados
}