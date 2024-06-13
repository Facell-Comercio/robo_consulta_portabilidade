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
                    NOT gsmProvisorio IS NULL
                    AND status_portabilidade <> 'ANTIGO' 
                    AND status_portabilidade <> 'ATIVA'
                    AND dtAtivacao BETWEEN ? AND ?
                    LIMIT 10
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
                        cliente.status,
                        cliente.motivo,
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

module.exports = {
    getClientes,
    updateClientes
}