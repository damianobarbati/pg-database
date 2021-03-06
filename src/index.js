import pg from 'pg';
import named from './named.js';
import logged from './logged.js';
import { removeLinesWithUndefinedReplacements } from './helpers.js';
import commonTags from 'common-tags';

const { stripIndent } = commonTags;

pg.types.setTypeParser(pg.types.builtins.TEXT, String);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);
pg.types.setTypeParser(pg.types.builtins.INT2, Number);
pg.types.setTypeParser(pg.types.builtins.INT4, Number);
pg.types.setTypeParser(pg.types.builtins.INT8, Number);
pg.types.setTypeParser(pg.types.builtins.FLOAT4, Number);
pg.types.setTypeParser(pg.types.builtins.FLOAT8, Number);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, String);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, String);

export default class Database {
    pool;
    close;
    query;

    constructor (connectionString, logFunc = Function.prototype) {
        const pool = new pg.Pool({ connectionString });

        named(pool);
        logged(pool, logFunc);

        this.pool = pool;
        this.query = pool.query.bind(pool);
        this.close = pool.end.bind(pool);
    }

    insert = async (table, replacements) => {
        const columns = Object.keys(replacements);
        const { rows: result } = await this.pool.query(`insert into "${table}" ("${columns.join('", "')}") values (:${columns.join(', :')}) returning *`, replacements);
        return result;
    };

    select = async (query, replacements = {}, removeUndefineds = false) => {
        if (removeUndefineds)
            query = removeLinesWithUndefinedReplacements(query, replacements);

        const { rows: result } = await this.pool.query(stripIndent(query), replacements);
        return result;
    };

    update = async (query, replacements = {}, returnRowCount = false) => {
        const { rowCount, rows: result } = await this.pool.query(stripIndent(query), replacements);
        return returnRowCount ? rowCount : result;
    };

    ['delete'] = async (query, replacements = {}, returnRowCount = false) => {
        const { rowCount, rows: result } = await this.pool.query(stripIndent(query), replacements);
        return returnRowCount ? rowCount : result;
    };
}

export const database = new Database(process.env.DB_URI, process.env.DB_LOG ? console.log : undefined);
