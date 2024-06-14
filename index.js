const cron = require('node-cron');
const { pupInit, pupClose } = require('./src/pup');
const { loginMartim, capturarDados } = require('./src/captura-portabilidade');
const { delay } = require('./src/helper');
const { getClientes, updateClientes, updateCliente, updateAtt } = require('./src/database');
require('dotenv').config();

const username = process.env.MATRICULA;
const password = process.env.SENHA;

async function init({ grupo_economico }) {
    try {
        // console.log('Iniciou')
        // * 1º Obter as linhas a analisar:
        const clientes = await getClientes({ grupo_economico })
        if (!clientes || !clientes.length) {
            throw new Error('Nenhum cliente recebido')
        }

        // * 2º Criar o Browser e a Page:
        const { browser, page } = await pupInit(true)

        // * 3º login:
        let tentativasLogin = 1;
        let loginRealizado = false;
        while (tentativasLogin <= 3) {
            try {
                await loginMartim({ page, username, password })
                loginRealizado = true;
                break;
            } catch (error) {
                console.log('ERRO_LOGIN:', error)
                tentativasLogin++
            }
        }

        if (!loginRealizado) {
            throw new Error('Falha no login do Martim')
        }
        await page.goto('https://capgeminibr.service-now.com/tim?id=tim_consulta_portabilidade')
        await delay(2000)

        // * 4º Loop e Captura:
        for (const cliente of clientes) {
            let tentativasCaptura = 1;
            while (tentativasCaptura <= 3) {
                try {
                    const clienteAtualizado = await capturarDados({
                        page,
                        cliente: {
                            id: cliente.id,
                            gsm: cliente.gsm,
                            status: 'NÃO ENCONTRADO',
                            motivo: null,
                        }
                    })
                    cliente.status = clienteAtualizado.status
                    cliente.motivo = clienteAtualizado.motivo
                    break;
                } catch (error) {
                    cliente.status = 'NÃO ENCONTRADO'
                    cliente.motivo = null

                    console.log(`Tentativa: ${tentativasCaptura} Linha: ${linha}`)
                    tentativasCaptura++
                }
            }
            // * 5º Update no banco:
            await updateCliente({ grupo_economico, cliente })
        }

        // * 6º Finalização:
        await pupClose({ browser, page })

        // * 7º Update ATT
        await updateAtt({grupo_economico})
        
        console.log(`Captura ${grupo_economico} realizada em ${new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. ${clientes.length} clientes`)
    } catch (error) {
        console.log('FATAL_ERROR:', error)
    }
}

// init({ grupo_economico: 'FORTTELECOM' })
// setTimeout(() => {
//     init({ grupo_economico: 'FACELL' })
// }, 1000 * 60 * 60)

cron.schedule('0 4 * * *', () => { init({ grupo_economico: 'FACELL' }) })
cron.schedule('0 5 * * *', () => { init({ grupo_economico: 'FORTTELECOM' }) })

cron.schedule('0 13 * * *', () => { init({ grupo_economico: 'FACELL' }) })
cron.schedule('0 14 * * *', () => { init({ grupo_economico: 'FORTTELECOM' }) })