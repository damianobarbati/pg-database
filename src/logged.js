import { tokenPattern } from './named.js';

export const query2executable = (query, replacements) => {
    if (!replacements)
        return query;

    for (const [key, value] of Object.entries(replacements)) {
        const pattern = new RegExp(`:${key}(?=\\)|\\b)`, 'g');
        query = query.replace(pattern, typeof value === 'number' || value === null ? value : `'${value}'`);
    }

    return query;
};

const patch = (client, logFunc = console.log) => {
    const originalQuery = client.query.bind(client);

    client.query = (query, replacements, cb) => {
        const sql = query.replace(tokenPattern, m => {
            const replacement = replacements[m.slice(1)];
            const result = valueToString(replacement)
            return result;
        });

        logFunc(sql);
        return originalQuery(query, replacements, cb);
    };

    return client;
};

const valueToString = value => {
    if (Array.isArray(value))
        return "'{" + value.map(valueToString) + "}'";
    else if (typeof value === 'number' || value === null)
        return value;
    else
        return `'${value}'`;
};

export default patch;