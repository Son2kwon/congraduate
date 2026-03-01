import { Stack } from '@mantine/core';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { OverallProgressCard } from '@/components/dashboard/OverallProgressCard';
import { MajorCreditStats } from '@/components/dashboard/MajorCreditStats';
import { CourseChecklistTable } from '@/components/dashboard/CourseChecklistTable';
import { COURSES, MAJOR_STATS, OVERALL_STATS } from '@/data/courses';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <Stack gap="xl" pb="xl">
        <OverallProgressCard
          completed={OVERALL_STATS.completed}
          required={OVERALL_STATS.required}
          liberal={OVERALL_STATS.liberal}
          majorStats={MAJOR_STATS.map((m) => ({
            name: m.name,
            type: m.type,
            completed: m.completed,
            required: m.required,
          }))}
        />

        <MajorCreditStats majorStats={MAJOR_STATS} />

        <CourseChecklistTable courses={COURSES} />
      </Stack>
    </DashboardShell>
  );
}
