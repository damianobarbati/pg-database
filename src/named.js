import difference from 'lodash/difference.js';
import intersection from 'lodash/intersection.js';
import map from 'lodash/map.js';
import reduce from 'lodash/reduce.js';
import uniq from 'lodash/uniq.js';

export const tokenPattern = /(?<!:)(?<=^|\b|\(|\s+)(?:\$|:)[a-zA-Z]([a-zA-Z0-9_]*)\b/g;

const numericFromNamed = (sql, parameters) => {
    const objTokens = Object.keys(parameters);
    const sqlTokens = uniq(map(sql.match(tokenPattern), token => token.substring(1)));
    const fillTokens = intersection(objTokens, sqlTokens).sort();
    const fillValues = map(fillTokens, token => parameters[token]);
    const unmatchedTokens = difference(sqlTokens, objTokens);
    const missing = unmatchedTokens.join(', ');
    const interpolatedSql = reduce(fillTokens, (partiallyInterpolated, token, index) => {
        const replaceAllPattern = new RegExp(`(?<!:)(?<=^|\\b|\\(|\\s+)(?:\\$|:)${fillTokens[index]}\\b`, 'g');
        return partiallyInterpolated.replace(replaceAllPattern, `$${index + 1}`);
    }, sql);

    if (unmatchedTokens.length)
        throw new Error(`pg-named: missing parameters ${missing}`);

    const result = { sql: interpolatedSql, values: fillValues };
    return result;
};

const patch = client => {
    if (client.query.patched)
        return client;

    const originalQuery = client.query.bind(client);

    const patchedQuery = (...args) => {
        if (typeof args[0] === 'string' && typeof args[1] === 'object' && !Array.isArray(args[1])) {
            const { sql, values } = numericFromNamed(args[0], args[1]);
            return originalQuery(sql, values, args[2]);
        }
        else if (typeof args[0] === 'object' && typeof args[1] === 'object' && !Array.isArray(args[1])) {
            const { sql, values } = numericFromNamed(args[0].text, args[1].values);
            return originalQuery(sql, values, args[2]);
        }

        return originalQuery(...args);
    };

    client.query = patchedQuery;
    client.query.patched = true;
    return client;
};

export default patch;
