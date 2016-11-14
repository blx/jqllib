import btoa from 'btoa'
import __fetch from 'fetch-ponyfill'
const {fetch: _fetch, Headers, Request} = __fetch()
import formurlencoded from 'form-urlencoded'
import {fromPairs} from 'lodash'
import moment from 'moment'

const MP_API_JQL_URI = 'https://mixpanel.com/api/2.0/jql/'

let _headers = new Headers()
_headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')

/**
 * Sets the Mixpanel secret key to use for requests.
 * Note: jqllib is stateful; this key is shared across all usages.
 */
// str -> ()
export function setApiKey(key) {
    _headers.set('Authorization', `Basic ${btoa(key + ':')}`)
}

/**
 * Returns the results of running the `jql` at Mixpanel.
 * Note: the Mixpanel API limits running time to a few minutes.
 */
// str -> Promise<?>
function mpFetch(jql) {
    if (!_headers.has('Authorization')) { throw 'API key not set' }

    jql = `function main() { ${jql} }`

    const data = formurlencoded({
        script: jql,
        params: JSON.stringify({})
    })

    return _fetch(new Request(MP_API_JQL_URI), {
        method: 'POST',
        headers: _headers,
        body: data,
        cache: 'no-cache'
    })
    .then(r => r.json())
}
export const fetch = mpFetch

/**
 * JQL query to fetch the People records with distinct ID in the `distinctIds`.
 */
// [str] -> str
export function peopleJql(distinctIds) {
    distinctIds = fromPairs(distinctIds.map(x => [x, 1]))  // O(1)ish hashset membership
    return `
        const ids = ${JSON.stringify(distinctIds)}
        return People()
            .filter(x => ids[x.distinct_id])
    `
}

/**
 * JQL query to fetch the `events` within `dateRange`, grouped by distinct user and with the
 * user's People record attached when applicable.
 */
// (Momentable, Momentable), [EventName]?, str? -> str
export function groupedPeopleJql(dateRange, events=[], propsExpr='x.event.properties') {
    return `
        ${baseJql(dateRange, events, {people: true})}
        .groupByUser((acc, xs) => {
            acc = acc || {events: [], user: xs[0].user}
            acc.events = acc.events.concat(xs.map(x => ({
                time: x.event.time,
                name: x.event.name,
                properties: _.clone(${propsExpr})
            })))
            return acc
        })
    `
}

/**
 * JQL query to fetch the `events` within `dateRange`, grouped by distinct user.
 */
// (Momentable, Momentable), [EventName]?, str? -> str
export function groupedJql(dateRange, events=[], propsExpr='x.properties') {
    // We clone the event's properties, since otherwise references to them are lost in
    // Mixpanel's map-reduce style processing.
    return `
        ${baseJql(dateRange, events)}
        .groupByUser((acc, xs) => {
            acc = acc || {events: []}
            acc.events = acc.events.concat(xs.map(x => ({
                time: x.time,
                name: x.name,
                properties: _.clone(${propsExpr})
            })))
            return acc
        })
    `
}

/**
 * JQL query to fetch the `events` within `dateRange`. If event names are not
 * specified, all events within the range will be fetched. If `people` is true,
 * a join against People will be performed.
 *
 * Note: JQL runs in a limited environment. Underscore.js is available.
 */
// (Momentable, Momentable), [EventName]?, {people?: bool} -> str
export function baseJql(dateRange, events=[], {people=false}={}) {
    const [from_date, to_date] = dateRange.map(s => dateFormat(moment(s)))
    const options = {from_date, to_date}

    if (events && events.length) {
        options.event_selectors = events
    }

    return ('return ' +
            (people ? 'join(' : '') +
            `Events(${JSON.stringify(options)})` +
            (people ? ', People()).filter(d => d.event)' : ''))
}

// Moment -> str
function dateFormat(d) { return d.format('YYYY-MM-DD') }
