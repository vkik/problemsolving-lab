import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useProject, useProjects } from '../store/projects'
import { STEP_KEYS, type Project, type StepKey } from '../lib/types'
import { StepShell } from '../components/StepShell'
import { DefineStep, DefineOutput } from '../steps/Define'
import { StructureStep, StructureOutput } from '../steps/Structure'
import { PrioritizeStep, PrioritizeOutput } from '../steps/Prioritize'
import { WorkplanStep, WorkplanOutput } from '../steps/Workplan'
import { AnalysesStep, AnalysesOutput } from '../steps/Analyses'
import { SynthesisStep, SynthesisOutput } from '../steps/Synthesis'
import { RecommendationsStep, RecommendationsOutput } from '../steps/Recommendations'

export interface StepProps {
  project: Project
  update: (recipe: (draft: Project) => void) => void
}

const STEPS: Record<StepKey, { Input: React.FC<StepProps>; Output: React.FC<{ project: Project }> }> = {
  define: { Input: DefineStep, Output: DefineOutput },
  structure: { Input: StructureStep, Output: StructureOutput },
  prioritize: { Input: PrioritizeStep, Output: PrioritizeOutput },
  workplan: { Input: WorkplanStep, Output: WorkplanOutput },
  analyses: { Input: AnalysesStep, Output: AnalysesOutput },
  synthesis: { Input: SynthesisStep, Output: SynthesisOutput },
  recommendations: { Input: RecommendationsStep, Output: RecommendationsOutput },
}

export function StepPage() {
  const { projectId, step } = useParams()
  const project = useProject(projectId)
  const updateStore = useProjects((s) => s.update)
  const valid = STEP_KEYS.includes(step as StepKey)

  useEffect(() => {
    if (project && valid && project.currentStep !== step) {
      updateStore(project.id, (d) => void (d.currentStep = step as StepKey), { touch: false })
    }
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, project?.id])

  if (!project) return <Navigate to="/" replace />
  if (!valid) return <Navigate to={`/p/${project.id}`} replace />
  const key = step as StepKey
  const { Input, Output } = STEPS[key]
  const update = (recipe: (d: Project) => void) => updateStore(project.id, recipe)
  return (
    <StepShell project={project} step={key} output={<Output project={project} />}>
      <Input project={project} update={update} />
    </StepShell>
  )
}
