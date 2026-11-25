// End-of-test reporting for k6: a short console report and Allure results, one per threshold.

/** The part of k6's end-of-test data this module reads. */
export interface Summary {
    metrics: Record<
        string,
        { values: Record<string, number>; thresholds?: Record<string, { ok: boolean }> }
    >;
    state: { testRunDurationMs: number };
}

const round = (value: number): string => String(Math.round(value * 100) / 100);

function thresholdResults(data: Summary) {
    return Object.entries(data.metrics).flatMap(([metric, m]) =>
        Object.entries(m.thresholds ?? {}).map(([expression, t]) => ({
            metric,
            expression,
            ok: t.ok,
            values: m.values,
        }))
    );
}

/** One line per threshold, plus the values it was checked against. */
export function textReport(data: Summary): string {
    const lines = thresholdResults(data).map(({ metric, expression, ok, values }) => {
        const measured = Object.entries(values)
            .map(([name, value]) => `${name}=${round(value)}`)
            .join(' ');
        return `${ok ? 'PASS' : 'FAIL'}  ${metric} ${expression}   ${measured}`;
    });
    return `\nk6 thresholds\n${lines.join('\n')}\n\n`;
}

/**
 * Every threshold becomes one Allure test result in `dir`, next to the Playwright results.
 * Measured values are parameters with `excluded: true`: Allure 3 builds the history id from
 * the name and the parameters, so changing numbers would otherwise start a new history each run.
 */
export function allureResults(data: Summary, script: string, dir: string): Record<string, string> {
    const stop = Date.now();
    const start = stop - data.state.testRunDurationMs;
    const summaryFile = `${script}-${stop}-k6-summary.json`;
    const files: Record<string, string> = {
        [`${dir}/${summaryFile}`]: JSON.stringify(data, null, 2),
    };
    thresholdResults(data).forEach(({ metric, expression, ok, values }, i) => {
        const uuid = `${script}-${stop}-${i}`;
        files[`${dir}/${uuid}-result.json`] = JSON.stringify({
            uuid,
            name: `${metric} ${expression}`,
            fullName: `perf/${script}.ts ${metric} ${expression}`,
            status: ok ? 'passed' : 'failed',
            stage: 'finished',
            start,
            stop,
            labels: [
                { name: 'parentSuite', value: 'Performance' },
                { name: 'suite', value: script },
                { name: 'tag', value: 'perf' },
            ],
            parameters: Object.entries(values).map(([name, value]) => ({
                name,
                value: round(value),
                excluded: true,
            })),
            attachments: [{ name: 'k6 summary', source: summaryFile, type: 'application/json' }],
        });
    });
    return files;
}
