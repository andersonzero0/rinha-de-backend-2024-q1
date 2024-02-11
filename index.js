import Fastify from 'fastify';
import connDB from './database/sqlite.js';

export const fastify = Fastify({
    logger: false
})

fastify.post('/clientes/:id/transacoes', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { valor, tipo, descricao } = req.body;

        if(descricao.lenght < 1 || descricao.lenght > 10) {
            res.status(400).send({
                statusCode: 400,
                message: 'Descricoa deve ter entre 1 a 10 caracteres'
            })
        }

        const db = await connDB();

        const cliente = await db.get('SELECT * FROM clientes WHERE id = ?;', [id])

        if(!cliente) {
            res.status(404).send({
                statusCode: 404,
                message: 'Cliente não encontrado.'
            })
        }

        if(tipo == 'd') {
            if(cliente.saldo - valor < cliente.limite * -1) {
                res.status(422).send({
                    statusCode: 422,
                    message: 'Limite atingido.'
                })
            }
        }

        await db.run('INSERT INTO transacoes (id_cliente, valor, tipo, descricao) VALUES (?, ?, ?, ?);',
        [cliente.id, valor, tipo, descricao])
        await db.run('UPDATE clientes SET saldo = ? WHERE id = ?', [cliente.saldo - valor, cliente.id])

        res.status(200).send({
            limite: cliente.limite,
            saldo: cliente.saldo - valor
        })
    } catch (error) {
        res.status(500);
        return error;
    }
})

fastify.get('/clientes/:id/extrato', async (req, res) => {
    try {
        const { id } = req.params;

        const db = await connDB();

        const cliente = await db.get('SELECT * FROM clientes WHERE id = ?;', [id])
        if(!cliente) {
            res.status(404).send({
                statusCode: 404,
                message: 'Cliente não encontrado.'
            })
        }

        const ultimas_transacoes = await db.all('SELECT valor, tipo, descricao, realizada_em FROM transacoes WHERE id_cliente = ? LIMIT 10', [cliente.id]);

        res.status(200).send({
            saldo: {
                total: cliente.saldo,
                data_extracao: new Date(),
                limite: cliente.limite
            },
            ultimas_transacoes
        })
    } catch (error) {
        console.log(error)
        res.status(500);
        return error
    }
})

fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    if(err) {
        fastify.log.error(err)
    }

    fastify.log.info(`server listening on ${address}`)
})

/*import connDB from './database/sqlite.js';

const db = await connDB();

await db.run(`CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,
    limite INTEGER,
    saldo INTEGER
);`)

await db.run(`CREATE TABLE transacoes (
    id_cliente INTEGER,
    valor INTEGER,
    tipo TEXT,
    descricao TEXT,
    realizada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);`)

const stmt = await db.prepare('INSERT INTO clientes (id, limite, saldo) VALUES (?, ?, ?);')
await stmt.run([1, 100000, 0])
await stmt.run([2, 80000, 0])
await stmt.run([3, 1000000, 0])
await stmt.run([4, 10000000, 0])
await stmt.run([5, 500000, 0])
await stmt.finalize()*/