export const removeLinesWithUndefinedReplacements = (query, replacements) => {
    for (const [key, value] of Object.entries(replacements)) {
        if (value === undefined) {
            const pattern = new RegExp(`.+:${key}(?![\\w\\d])(.+$|$)`, 'gimu');
            query = query.replace(pattern, '');
            delete replacements[key];
        }
    }

    // remove empty sequences of \n
    query = query.replace(/\n+/gims, '\n');

    return query;
};
