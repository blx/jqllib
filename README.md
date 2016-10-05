# jqllib

Lightweight, isomorphic JS client for making Mixpanel JQL queries.

This is an alternative to including the heavyweight official `MP` library.

This does two things:
- provides functions to generate base JQL queries (`baseJql([EventName], [Date, Date])` and `groupedJql`)
- provides a function to post JQL queries to Mixpanel's API

Examples are in ES6 but the NPM build is transpiled down to ES5 for ease of use.

## Usage

```javascript
import * as jqllib from 'jqllib'

jqllib.setApiKey(MIXPANEL_SECRET_KEY)

const query = jqllib.baseJql(['Account Created'], ['2016-07-01', '2016-07-08'])

jqllib
    .fetch(query)
    .then(events => { console.log(events) })

// [{name: 'Account Created', distinct_id: 1234, properties: {...}, ...}]

const groupedByUserQuery = jqllib.groupedJql(['Clicked Button A', 'Clicked Button B'],
                                             ['2016-09-01', '2016-09-15'])

jqllib
    .fetch(groupedByUserQuery)
    .then(groups => {
        groups.forEach(({key, events}) => {
            console.log(`User ${key} clicked Buttons A/B ${events.length} times`)
        })
    })

// User 9101 clicked Buttons A/B 3 times
// User 9505 clicked Buttons A/B 5 times
// ...
```
