/**
 * StepIdentity - Step for identity statement
 */

import { useCreateHabitContext } from '../CreateHabitContext'
import { IdentityPrompt } from '../../../components/habits'

/**
 * Step for entering the identity statement
 */
export function StepIdentity() {
  const { form, updateForm } = useCreateHabitContext()

  const handleIdentityChange = (statement: string) => {
    updateForm('identityStatement', statement)
  }

  return (
    <div className="create-habit__content step-identity">
      <IdentityPrompt
        identityStatement={form.identityStatement}
        onIdentityChange={handleIdentityChange}
      />
    </div>
  )
}
