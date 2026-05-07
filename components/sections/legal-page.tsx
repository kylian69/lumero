import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

type Crumb = { label: string; href?: string };

export function LegalPage({
  breadcrumb,
  content,
}: {
  breadcrumb: Crumb[];
  content: string;
}) {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <section className="py-12 sm:py-16">
          <div className="container max-w-3xl">
            <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
              <ol className="flex items-center gap-2 flex-wrap">
                {breadcrumb.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {i > 0 && <span aria-hidden>/</span>}
                    {c.href ? (
                      <Link href={c.href} className="hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <article className="prose prose-neutral dark:prose-invert mt-8 max-w-none prose-headings:tracking-tight prose-h1:text-3xl sm:prose-h1:text-4xl prose-h2:mt-10 prose-table:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
