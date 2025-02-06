import { prisma } from '@/lib/db'

export default async function Home() {
  const projects = await prisma.project.findMany({
    include: {
      insights: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
      tasks: {
        where: {
          status: 'open',
        },
        orderBy: {
          dueDate: 'asc',
        },
      },
    },
  })

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8">Project Owl</h1>
        
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">{project.name}</h2>
              
              {project.insights[0] && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Latest Update</h3>
                  <p className="text-gray-600">{project.insights[0].recap}</p>
                  
                  {project.insights[0].risks && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600">Risks & Blockers</h4>
                      <p className="text-gray-600">{project.insights[0].risks}</p>
                    </div>
                  )}
                </div>
              )}
              
              {project.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Open Tasks</h3>
                  <ul className="space-y-2">
                    {project.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <span>{task.description}</span>
                        {task.assignee && (
                          <span className="text-sm text-gray-500">
                            @{task.assignee}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-sm text-gray-500">
                            Due: {task.dueDate.toLocaleDateString()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  )
}
