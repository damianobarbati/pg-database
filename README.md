# pg-database

## Overview
Handy wrapper for `pg` (formerly `node-postgres`) database connection instances featuring:
- CRUD operation wrappers
- named placeholders
- query logging

You can either instantiate a db connection:

```javascript
import Database from 'pg-database';
const database = new Database('<connection-uri>', console.log);
```

Or import an already instantiated db connection, setting `DB_URI=<connection-uri>` and `DB_LOG=1` env variables:

```javascript
import { database } from 'pg-database';
```

You can use this module as a simple drop-in replacement for `pg`:

```javascript
import { database } from 'pg-database';

(async () => {
    const client = await database.pool.connect();
    client.query('LISTEN events');
    client.on('notification', console.log);
    client.on('error', console.error);
    await client.release();
})();
```

### CRUD
Just give a look at `src/index.js` to get a picture of it: minimal and simple.

### Named placeholders
Use object replacements (named placeholders) and not array replacements (positional placeholders).

Placeholders must begin with `:` or `$` and can contain only letters, numbers, underscores, dashes.

Before:
```javascript
client.query('SELECT name FROM people WHERE name = $1', ['john'])
```

After:
```javascript
client.query('SELECT name FROM people WHERE name = :name', { name: 'john' })
```

### Query logging
Log executed queries.

Either create your db instance with a customer logger:
```javascript
const database = new Database('<connection-uri>', console.log);
```

Or use the automatic instance setting `DB_URI=<connection-uri>` and `DB_LOG=1` env variables:
```javascript
import { database } from 'pg-database';
```

## Development
```
yarn test:db-start # start docker test db
yarn test          # run tests
yarn test:db-stop  # stop docker test db
```
