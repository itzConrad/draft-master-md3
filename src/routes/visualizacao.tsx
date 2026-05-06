import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/visualizacao')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/visualizacao"!</div>
}
