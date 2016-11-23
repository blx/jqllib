import * as fromPairs from 'lodash/fromPairs'
import * as moment from 'moment'
import Moment = moment.Moment

import {DateRange, GroupedEvents, JQL, MPEvent, MPPerson} from '../types'
export {JQL, GroupedEvents, MPEvent, MPPerson}

/**
 * JQL query to fetch the People records with distinct ID in the `distinctIds`.
 */
export function peopleJql(distinctIds: string[]): JQL<MPPerson[]> {
    const distinctIdSet = fromPairs(distinctIds.map(x => [x, 1]))  // hashset membership
    return `
        const ids = ${JSON.stringify(distinctIdSet)}
        return People()
            .filter(x => ids[x.distinct_id])
            .map(x => {
                const y = _.clone(x)
                y.distinctId = y.distinct_id
                delete y.distinct_id
                return y
            })
    `
}

/**
 * JQL query to fetch the `events` within `dateRange`, grouped by distinct user and with the
 * user's People record attached when applicable.
 */
export function groupedPeopleJql(dateRange: DateRange, events?: string[]): JQL<{key: [string], value: {events: MPEvent[], user: MPPerson | null}}[]> {
    return subsetGroupedPeopleJql<MPEvent>(dateRange, events)
}

export function subsetGroupedPeopleJql<E>(dateRange: DateRange, events?: string[], propsExpr='x.event.properties'): JQL<{key: [string], value: {events: E[], user: any}}[]> {
    return `
        ${baseJqlWithPeople(dateRange, events)}
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
export function groupedJql(dateRange: DateRange, events: string[] = []): JQL<GroupedEvents<MPEvent>[]> {
    return subsetGroupedJql<MPEvent>(dateRange, events)
}

export function subsetGroupedJql<E>(dateRange: DateRange, events: string[] = [], propsExpr='x.properties'): JQL<GroupedEvents<E>[]> {
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
 * JQL query to fetch the `events` within `dateRange`, joined with their People records.
 * If event names are not specified, all events within the range will be fetched.
 */
export function baseJqlWithPeople(dateRange: DateRange, events?: string[]): JQL<{distinct_id: string, event: MPEvent, user: MPPerson}[]> {
    const options = parseDateEventOptions(dateRange, events)
    return `
        return join(
            Events(${JSON.stringify(options)}),
            People()
        ).filter(t => t.event)
    `
}

/**
 * JQL query to fetch the `events` within `dateRange`. If event names are not
 * specified, all events within the range will be fetched. If `people` is true,
 * a join against People will be performed.
 *
 * Note: JQL runs in a limited environment. Underscore.js is available.
 */
export function baseJql(dateRange: DateRange, events?: string[]): JQL<MPEvent[]> {
    const options = parseDateEventOptions(dateRange, events)
    return `return Events(${JSON.stringify(options)})`
}

function parseDateEventOptions(dateRange: DateRange, events: string[]) {
    const [from_date, to_date] = dateRange.map(s => dateFormat(moment(s)))
    const options: any = {from_date, to_date}

    if (events && events.length) {
        options.event_selectors = events
    }

    return options
}

function dateFormat(d: Moment): string { return d.format('YYYY-MM-DD') }
