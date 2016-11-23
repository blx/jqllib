/** JQL query that should result in data of type T.
 * Behaves like a string; interface is for transparent typesafety. */
export interface JQL<T> extends String {
    __?: T  // Force the generic to specialize on T
}

/** Inclusive date interval, eg. ['2016-01-01', '2016-11-05'] */
export type DateRange = [string, string]

// https://mixpanel.com/help/reference/jql/api-reference#api/Events
export interface MPEvent {
    name: string
    distinct_id: string
    time: number
    sampling_factor: number
    properties: any
}

export interface GroupedEvents<E> {
    distinctId: string
    events: E[]
}

// https://mixpanel.com/help/reference/jql/api-reference#api/People
export interface MPPerson {
    distinctId: string
    time: number
    properties: any
}
