# jqllib

TypeScript/Javascript functions to help write Mixpanel JQL queries, optionally in a typesafe way.

## Types

`JQL<T>` is a typesafe string containing a JQL query expected to return data of type T from Mixpanel. "Typesafe string" means that for noncompatible types X, Y, a `JQL<X>` can't be assigned to a `JQL<Y>`.

To carry the invisible type parameter, it inherits from `String`. So if you want a primitive `string`, cast `as string`. However, it will behave like any normal string when, say, concatenating.

`MPEvent` and `MPPerson` are interfaces modeling Mixpanel Event and Person objects, and `GroupedEvents<E>` is a Mixpanel `distinctId` and list of events of type `E` (genericized in case you want to be returning slimmed-down event objects).

## Usage

```typescript
import * as jqllib from 'jqllib'
import {JQL, MPEvent, GroupedEvents} from 'jqllib'

// Query for all the Account Created events in a week (inclusive) in July.
const query: JQL<MPEvent[]> = jqllib.baseJql(['2016-07-01', '2016-07-08'],
                                             ['Account Created'])

// Posting to Mixpanel API returns:
// [{name: 'Account Created', distinct_id: 1234, properties: {...}, ...}]

const groupedByUserQuery: JQL<GroupedEvents<MPEvent>[]> = jqllib.groupedJql(['2016-09-01', '2016-09-15'],
                                                                            ['Clicked Button A', 'Clicked Button B'])

jqllib
    .fetch(groupedByUserQuery)
    .then(groups => {
        groups.forEach(({distinctId, events}) => {
            console.log(`User ${distinctId} clicked Buttons A/B ${events.length} times`)
        })
    })

// Posting to Mixpanel API returns:
// User 9101 clicked Buttons A/B 3 times
// User 9505 clicked Buttons A/B 5 times
// ...

const peopleQuery: JQL<MPPerson[]> = jqllib.peopleJql(['1', '9fc1e'])

// Posting to Mixpanel API returns:
// [{distinctId: '1', time: 1478883954772, properties: {'$first_name': 'Jose', ...}},
//  {distinctId: '9fc1e', time: 1478893934721, properties: {...}}]
```

## Running

This just gives you strings. To run them, post them to Mixpanel's API as per their docs, or use the (Node-only, currently) `jqllib-fetch` package.
