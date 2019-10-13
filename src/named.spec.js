import pgNamed from './named.js';

// dummy database
const database = {};
database.query = (sql, values, callback) => {
    const out = { sql, values, callback };

    if (typeof sql === 'object' && typeof values === 'function' && callback === undefined) {
        out.sql = sql.text;
        out.values = sql.values;
        out.callback = values;
    }

    return out;
};

pgNamed(database);

describe('pg-named', () => {
    it('success: simple', () => {
        const { sql, values } = database.query('$a $b $c', { a: 10, b: 20, c: 30 });

        expect(sql).toEqual('$1 $2 $3');
        expect(values).toEqual([10, 20, 30]);
    });

    it('success: order of parameters differs from order in SQL query', () => {
        const { sql, values } = database.query('$z $y $x', { z: 10, y: 20, x: 30 });

        expect(sql).toEqual('$3 $2 $1');
        expect(values).toEqual([30, 20, 10]);
    });

    it('success: extra parameters', () => {
        expect(() => {
            database.query('$x $y $z', { w: 0, x: 10, y: 20, z: 30 });
        }).not.toThrowError();
    });

    it('failure: missing parameters', () => {
        expect(() => {
            database.query('$z $y $x', { z: 10, y: 20 });
        }).toThrowError('pg-named: missing parameters x');
    });

    it('success: word boundaries', () => {
        const { sql, values } = database.query('$a $aa', { a: 5, aa: 23 });

        expect(sql).toEqual('$1 $2');
        expect(values).toEqual([5, 23]);
    });

    it('success: call with original signature results in unchanged call to original function', () => {
        const sql = 'SELECT name FORM person WHERE name = $1 AND tenure <= $2 AND age <= $3';
        const values = ['Ursus Oestergardii', 3, 24];
        const result = database.query(sql, values);

        expect(result.sql).toEqual(sql);
        expect(result.values).toEqual(values);
        expect(result.callback).toEqual(undefined);
    });

    it('success: call with no values results in unchanged call to original function', () => {
        const sql = 'SELECT name FORM person WHERE name = $1 AND tenure <= $2 AND age <= $3';
        const result = database.query(sql);

        expect(result.sql).toEqual(sql);
        expect(result.values).toEqual(undefined);
        expect(result.callback).toEqual(undefined);
    });

    it('success: named parameter call dispatched correctly', () => {
        const sql = 'SELECT name FORM person WHERE name = $name AND tenure <= $tenure AND age <= $age';
        const values = {
            name: 'Ursus Oestergardii',
            tenure: 3,
            age: 24
        };
        const result = database.query(sql, values);

        expect(result.sql).toEqual('SELECT name FORM person WHERE name = $2 AND tenure <= $3 AND age <= $1');
        expect(result.values).toEqual([24, 'Ursus Oestergardii', 3]);
    });

    it('success: handles arrays', () => {
        const sql = 'SELECT * FROM table WHERE name LIKE $name AND id = ANY($ids::int[])';
        const values = {
            ids: [13, 37],
            name: 'jarse'
        };
        const result = database.query(sql, values);

        expect(result.sql).toEqual('SELECT * FROM table WHERE name LIKE $2 AND id = ANY($1::int[])');
        expect(result.values).toEqual([[13, 37], 'jarse']);
    });

    it('success: sql cointaning named placeholder prefix', async () => {
        const sql = `select '{"handpicked":true}' as value`;
        const result = database.query(sql);

        expect(result.sql).toEqual(sql);
    });

    it('success: sql cointaning named placeholder prefix and a space', async () => {
        const sql = `select '{"handpicked": true}' as value`;
        const result = database.query(sql);

        expect(result.sql).toEqual(sql);
    });

    it('success: sql cointaning comment with tick and parens', async () => {
        const sql = `select
            '{"handpicked": true}' -- this shouldn't cause any problem(s)
        `;
        const result = database.query(sql);

        expect(result.sql).toEqual(sql);
    });
});