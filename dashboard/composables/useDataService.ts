import type { Slice } from "@services/DateService";
import DateService from "@services/DateService";
import type { MetricsCounts } from "~/server/api/metrics/[project_id]/counts";
import type { VisitsWebsiteAggregated } from "~/server/api/metrics/[project_id]/data/websites";
import type { MetricsTimeline } from "~/server/api/metrics/[project_id]/timeline/generic";

export function useMetricsData() {
    const activeProject = useActiveProject();
    const metricsInfo = useFetch<MetricsCounts>(`/api/metrics/${activeProject.value?._id}/counts`, {
        ...signHeaders(),
        lazy: true
    });
    return metricsInfo;
}

export function useFirstInteractionData() {
    const activeProject = useActiveProject();
    const metricsInfo = useFetch<boolean>(`/api/metrics/${activeProject.value?._id}/first_interaction`, signHeaders());
    return metricsInfo;
}


export async function useTimelineAdvanced(endpoint: string, slice: Slice, fromDate?: string, toDate?: string, customBody: Object = {}) {

    const { from, to } = DateService.prepareDateRange(
        fromDate || DateService.getDefaultRange(slice).from,
        toDate || DateService.getDefaultRange(slice).to,
        slice
    );

    const activeProject = useActiveProject();
    const response = await $fetch(
        `/api/metrics/${activeProject.value?._id}/timeline/${endpoint}`, {
        method: 'POST',
        ...signHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slice, from, to, ...customBody })
    });

    return response as { _id: string, count: number }[];

}


export async function useTimeline(endpoint: 'visits' | 'sessions' | 'referrers', slice: Slice, fromDate?: string, toDate?: string) {
    return await useTimelineAdvanced(endpoint, slice, fromDate, toDate, {});
}

export async function useReferrersTimeline(referrer: string, slice: Slice, fromDate?: string, toDate?: string) {
    return await useTimelineAdvanced('referrers', slice, fromDate, toDate, { referrer });
}



export async function useTimelineDataRaw(timelineEndpointName: string, slice: SliceName) {
    const activeProject = useActiveProject();

    const response = await $fetch<{ data: MetricsTimeline[], from: string, to: string }>(
        `/api/metrics/${activeProject.value?._id}/timeline/${timelineEndpointName}`, {
        method: 'POST',
        ...signHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slice }),
    });

    return response;
}

export async function useTimelineData(timelineEndpointName: string, slice: SliceName) {
    const response = await useTimelineDataRaw(timelineEndpointName, slice);
    if (!response) return;
    const fixed = fixMetrics(response, slice);
    return fixed;
}

export function usePagesData(website: string, limit: number = 10) {
    const activeProject = useActiveProject();

    const res = useFetch<VisitsWebsiteAggregated[]>(`/api/metrics/${activeProject.value?._id}/data/pages`, {
        ...signHeaders({
            'x-query-limit': limit.toString(),
            'x-website-name': website
        }),
        key: `pages_data:${website}:${limit}`,
        lazy: true
    });

    return res;

}

const { safeSnapshotDates } = useSnapshot()

export function useWebsitesData(limit: number = 10) {
    const activeProject = useActiveProject();
    const res = useFetch<VisitsWebsiteAggregated[]>(`/api/metrics/${activeProject.value?._id}/data/websites`, {
        ...signHeaders({ 
            'x-query-limit': limit.toString(),
            'x-from': safeSnapshotDates.value.from,
            'x-to': safeSnapshotDates.value.to
         }),
        key: `websites_data:${limit}:${safeSnapshotDates.value.from}:${safeSnapshotDates.value.to}`,
        lazy: true,
    });
    return res;
}
