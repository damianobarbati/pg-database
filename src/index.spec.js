import { execSync } from 'child_process';
import { database } from './index.js';

describe('database', () => {
    beforeAll(async () => {
        const command = `psql ${process.env.DB_URI} -c 'create table foos ( id serial primary key, content text )'`;
        console.log('>>', command);
        const result = execSync(command).toString();
        console.log('<<', result);
    });

    afterAll(async () => {
        const command = `psql ${process.env.DB_URI} -c 'drop table foos'`;
        console.log('>>', command);
        const result = execSync(command).toString();
        console.log('<<', result);
        await database.close();
    });

    it('works', async () => {
        const [select1] = await database.select('select 1 + $random as value1, 2 + $random as value2 where $random = $random', { random: 123 });
        expect(select1).toEqual({ value1: 124, value2: 125 });

        const [insert1] = await database.insert('foos', { content: 'hello!' });
        expect(insert1).toEqual({ id: 1, content: 'hello!' });

        await database.insert('foos', { content: 'hola!' });
        await database.insert('foos', { content: 'ciao!' });
        await database.insert('foos', { content: 'olá!' });
        await database.insert('foos', { content: 'salut!' });

        const update1 = await database.update('update foos set content = :content where id = :id returning *', { content: 'hola!', id: 1 });
        expect(update1.length).toEqual(1);
        expect(update1[0]).toEqual({ id: 1, content: 'hola!' });

        const update2 = await database.update('update foos set content = :content where id <= :id returning *', { content: 'hola!', id: 2 });
        expect(update2.length).toEqual(2);
        expect(update2[0]).toEqual({ id: 1, content: 'hola!' });
        expect(update2[1]).toEqual({ id: 2, content: 'hola!' });

        const delete1 = await database.delete('delete from foos where id = :id returning *', { id: 1, limit: 1 }, true);
        const delete2 = await database.delete('delete from foos where id <= :id returning *', { id: 3 }, true);
        expect(delete1).toEqual(1);
        expect(delete2).toEqual(2);
    });

    describe('in clause', () => {
        it('success', async () => {
            const [result] = await database.select(`select 1 = any('{1,2,3}') as value`);

            expect(result).toEqual({ value: true });
        });

        it('success', async () => {
            const [result] = await database.select(`select 4 = any('{1,2,3}') as value`);

            expect(result).toEqual({ value: false });
        });

        it('success', async () => {
            const [result] = await database.select(`select 1 != any('{1,2,3}') as value`);

            expect(result).toEqual({ value: true });
        });

        it('success', async () => {
            const [result] = await database.select('select 1 = any(:ids) as value', { ids: ['1', '2', '3'] });

            expect(result).toEqual({ value: true });
        });

        it('success', async () => {
            const [result] = await database.select('select 1::text = any(:ids) as value', { ids: ['a', 'b', 'c'] });

            expect(result).toEqual({ value: false });
        });
    });

    it('success with string containing named placeholder prefix', async () => {
        const [result] = await database.select(`select '{"handpicked":true}' as value`);

        expect(result.value).toEqual(`{"handpicked":true}`);
    });

    it('success with string containing named placeholder prefix and a space', async () => {
        const [result] = await database.select(`select '{"handpicked": true}' as value`);

        expect(result.value).toEqual(`{"handpicked": true}`);
    });

    it('success (multiple empty lines)', async () => {
        const [result] = await database.select(`
            select
                '{"handpicked":true}' as value -- should't cause: any problems
        `);

        expect(result.value).toEqual(`{"handpicked":true}`);
    });
});
