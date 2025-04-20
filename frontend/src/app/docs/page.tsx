import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface DocsSidebarProps {
  className?: string
}

const navigation = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        href: "/docs/introduction",
      },
      {
        title: "Installation",
        href: "/docs/installation",
      },
    ],
  },
  {
    title: "Components",
    items: [
      {
        title: "Overview",
        href: "/docs/components",
      },
      {
        title: "Usage",
        href: "/docs/components/usage",
      },
    ],
  },
]

function DocsSidebar({ className }: DocsSidebarProps) {
  return (
    <div className={className}>
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="space-y-4 py-4">
          {navigation.map((section) => (
            <div key={section.title} className="px-3 py-2">
              <h4 className="mb-1 text-sm font-medium">{section.title}</h4>
              <Separator className="my-2" />
              {section.items.map((item) => (
                <div key={item.href} className="group relative">
                  <a
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.title}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r">
        <DocsSidebar className="sticky top-14" />
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-6 leading-7 text-muted-foreground">
            Welcome to the documentation. Here you'll find comprehensive guides and documentation to help you start working with our platform as quickly as possible.
          </p>
          
          {/* Add your documentation content here */}
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Getting Started</h2>
              <p className="mt-4 leading-7">
                Learn how to get started with our platform and explore its features.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 