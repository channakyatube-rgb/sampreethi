import Navbar from "@/components/Navbar";
import workshopImg from "@/assets/workshop.jpg";

const teamStats = [
  { label: "Technicians", value: "48+" },
  { label: "Design Professionals", value: "16+" },
  { label: "Project Supervisors", value: "8+" },
  { label: "Support Staff", value: "22+" },
];

const teamHighlights = [
  {
    title: "Site Technicians",
    summary:
      "Our technicians handle precise installation of plywood, veneers, laminates, and hardware with strict quality checks.",
  },
  {
    title: "Design And Planning Team",
    summary:
      "Interior planning experts map each project from concept to execution and align material selection with customer budget.",
  },
  {
    title: "Production And Finishing Team",
    summary:
      "Experienced workshop professionals focus on cutting accuracy, polish quality, and long-term durability for every fit-out.",
  },
  {
    title: "Client Coordination Team",
    summary:
      "Dedicated coordinators manage schedules, updates, and handovers so each project stays on track and transparent.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-background to-beige/20">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-accent text-sm tracking-[0.2em] uppercase font-medium mb-2">About Sampreethi</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">People Behind Our Craft</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Sampreethi Plywood & Veneer combines material expertise with execution strength. Our team includes
              skilled technicians, design professionals, and delivery coordinators who work together on residential
              and commercial projects across Hyderabad.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              From initial drawings to final installation, every stage is managed by specialized team members to
              ensure quality, durability, and timely completion.
            </p>
          </div>

          <div className="relative">
            <img
              src={workshopImg}
              alt="Sampreethi team at workshop"
              className="w-full rounded-xl shadow-xl aspect-[4/3] object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamStats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 text-center">
              <p className="text-3xl font-heading font-bold text-accent">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-heading font-semibold text-foreground">Our Team Structure</h2>
          <p className="mt-2 text-muted-foreground text-sm max-w-3xl">
            A brief look at the people and roles that deliver each project end-to-end.
          </p>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {teamHighlights.map((highlight) => (
              <article key={highlight.title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{highlight.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
