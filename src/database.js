const { subMonths, startOfMonth, formatDate } = require("date-fns");
const { db } = require("../mysql");

async function getClientes({ grupo_economico }) {
    return new Promise(async (resolve, reject) => {
        const conn = await db.getConnection()
        try {
            const facell_docs = grupo_economico == 'FACELL' ? 'facell_docs' : 'facell_docs_fort';

            const dataInicial = formatDate(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
            const dataFinal = formatDate(new Date(), 'yyyy-MM-dd')

            const [gsms] = await conn.execute(`SELECT id, gsm FROM ${facell_docs} 
                WHERE 
                    NOT modalidade = 'PORTABILIDADE PRÉ-PAGO'
                    AND NOT gsmProvisorio IS NULL
                    AND status_portabilidade <> 'ANTIGO' 
                    AND status_portabilidade <> 'ATIVA'
                    AND dtAtivacao BETWEEN ? AND ?
                `, [dataInicial, dataFinal])

            resolve(gsms)
        } catch (error) {
            console.log('ERROR_GET_CLIENTES',error)
            reject(error)
        }
    })
}

async function updateClientes({ grupo_economico, clientes }) {
    return new Promise(async (resolve, reject) => {
        const conn = await db.getConnection()
        try {
            if (!clientes || !clientes.length) {
                throw new Error('Nenhum cliente a importar')
            }
            await conn.beginTransaction()
            const facell_docs = grupo_economico == 'FACELL' ? 'facell_docs' : 'facell_docs_fort';

            for (const cliente of clientes) {
                await conn.execute(`
                    UPDATE ${facell_docs}
                    SET
                        status_portabilidade = ?,
                        motivo_portabilidade = ?
                    WHERE 
                        id = ?`,
                    [
                        cliente.status?.substring(0,50) || 'NÃO LOCALIZADO',
                        cliente.motivo?.substring(0,100) || '',
                        cliente.id
                    ])
            }
            await conn.commit()
            resolve(true)
        } catch (error) {
            await conn.rollback()
            reject('ERRO_UPDATE_CLIENTES_PORTABILIDADE', error)
        }finally{
            conn.release()
        }
    })
}

async function updateCliente({ grupo_economico, cliente }) {
    return new Promise(async (resolve, reject) => {
        const conn = await db.getConnection()
        try {
            if (!cliente) {
                throw new Error('Nenhum cliente a importar')
            }
            const facell_docs = grupo_economico == 'FACELL' ? 'facell_docs' : 'facell_docs_fort';

                await conn.execute(`
                    UPDATE ${facell_docs}
                    SET
                        status_portabilidade = ?,
                        motivo_portabilidade = ?
                    WHERE 
                        id = ?`,
                    [
                        cliente.status?.substring(0,50) || 'NÃO LOCALIZADO',
                        cliente.motivo?.substring(0,100) || '',
                        cliente.id
                    ])

            resolve(true)
        } catch (error) {
            reject('ERRO_UPDATE_CLIENTES_PORTABILIDADE', error)
        }finally{
            conn.release()
        }
    })
}

async function updateAtt({ grupo_economico }) {
    return new Promise(async (resolve, reject) => {
        const conn = await db.getConnection()
        try {
            if (!grupo_economico) {
                throw new Error('Nenhum cliente a importar')
            }
            const relatorio = grupo_economico == 'FACELL' ? 'portab-facell' : 'portab-fort';

                await conn.execute(`
                    UPDATE facell_esteira_att
                    SET
                        data = current_timestamp()
                    WHERE 
                        relatorio = ?`,
                    [relatorio])

            resolve(true)
        } catch (error) {
            reject('ERRO_UPDATE_CLIENTES_PORTABILIDADE', error)
        }finally{
            conn.release()
        }
    })
}

module.exports = {
    getClientes,
    updateCliente,
    updateClientes,
    updateAtt,
}