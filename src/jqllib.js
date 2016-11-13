import btoa from 'btoa'
import __fetch from 'fetch-ponyfill'
const {fetch: _fetch, Headers, Request} = __fetch()
import formurlencoded from 'form-urlencoded'
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
 * Returns the results of running the `jql` at Mixpanel (either a list of events or a list of groups,
 * depending on your JQL).
 * Note: the Mixpanel API limits running time to ~2 mins.
 */
// <MPResult> str -> Promise<[MPResult]>
// where MPResult :: MPEvent | MPGroup
// where MPEvent :: {name: str, distinct_id: str, time: int, sampling_factor: int, properties: {[str]: str}}
//       MPGroup :: {key: [str], value: [<WHATEVER>]}
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
 * JQL query to fetch the `events` within `dateRange`, grouped by distinct user.
 */
// [EventName], (Momentable, Momentable), str? -> str
export function groupedJql(dateRange, events=[], propsExpr='x.properties') {
    // We clone the event's properties, since otherwise references to them are lost in
    // Mixpanel's map-reduce style processing.
    return `
        ${baseJql(events, dateRange)}
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
 * specified, all events within the range will be fetched.
 *
 * Note: JQL runs in a limited environment. Underscore.js is available.
 */
// (Momentable, Momentable), [EventName]? -> str
export function baseJql(dateRange, events=[]) {
    const [from_date, to_date] = dateRange.map(s => dateFormat(moment(s)))
    const options = {from_date, to_date}

    if (events && events.length) {
        options.event_selectors = events
    }

    return `return Events(${JSON.stringify(options)})`
}

// Moment -> str
function dateFormat(d) { return d.format('YYYY-MM-DD') }
