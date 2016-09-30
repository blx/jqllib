import moment from 'moment'

const MP_API_JQL_URI = 'https://mixpanel.com/api/2.0/jql/'

let _headers = new Headers()
_headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')

export function setApiKey(key) {
    _headers.set('Authorization', `Basic ${btoa(key + ':')}`)
}

export function mpFetch(jql) {
    if (!_headers.has('Authorization')) { throw 'API key not set' }

    jql = `function main() { ${jql} }`

    const data = new URLSearchParams()
    data.set('script', jql)
    data.set('params', JSON.stringify({}))

    return fetch(new Request(MP_API_JQL_URI), {
        method: 'POST',
        headers: _headers,
        body: data.toString(),
        cache: 'no-cache'
    })
    .then(r => r.json())
}

/**
 * JQL query to fetch the `events` within `dateRange`, grouped by distinct user.
 */
export function baseJql(events, dateRange, propsExpr='x.properties') {
    const [from_date, to_date] = dateRange.map(s => dateFormat(moment(s)))
    return `
        return Events(${JSON.stringify({
            from_date,
            to_date,
            event_selectors: events
        })})
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

// Moment -> str
function dateFormat(d) { return d.format('YYYY-MM-DD') }
