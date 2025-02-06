import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
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
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, channelId } = await request.json()

    const project = await prisma.project.create({
      data: {
        name,
        channelId,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
