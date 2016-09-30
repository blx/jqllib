# jqllib

Lightweight client for making Mixpanel JQL queries.

This is an alternative to including the heavyweight official `MP` library.

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
