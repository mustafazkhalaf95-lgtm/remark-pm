export interface Role {
    id: string;           // URL slug
    title: string;
    description: string;
    tags: { label: string; color: "violet" | "blue" | "pink" | "emerald" | "amber" | "cyan" }[];
}

export const ROLES: Role[] = [
    {
        id: "marketing-manager",
        title: "Marketing Manager",
        description:
            "Lead multi-channel campaigns, define brand positioning, and drive measurable growth across all marketing funnels.",
        tags: [
            { label: "Strategy", color: "violet" },
            { label: "Team Lead", color: "blue" },
            { label: "Full-time", color: "emerald" },
        ],
    },
    {
        id: "marketing-coordinator",
        title: "Marketing Coordinator",
        description:
            "Coordinate marketing initiatives, manage project timelines, and keep cross-functional teams aligned on deliverables.",
        tags: [
            { label: "Coordination", color: "blue" },
            { label: "Operations", color: "cyan" },
            { label: "Full-time", color: "emerald" },
        ],
    },
    {
        id: "social-media-specialist",
        title: "Social Media Specialist",
        description:
            "Craft compelling content calendars, grow our community, and turn followers into brand advocates.",
        tags: [
            { label: "Content", color: "pink" },
            { label: "Community", color: "violet" },
            { label: "Analytics", color: "amber" },
        ],
    },
    {
        id: "media-buyer",
        title: "Media Buyer",
        description:
            "Plan, purchase, and optimize paid media across Meta, Google, TikTok and beyond to maximize ROAS.",
        tags: [
            { label: "Paid Ads", color: "amber" },
            { label: "ROAS", color: "cyan" },
            { label: "Full-time", color: "emerald" },
        ],
    },
    {
        id: "creative-director",
        title: "Creative Director",
        description:
            "Set the visual and conceptual direction of the brand, overseeing design, copy, and creative production.",
        tags: [
            { label: "Leadership", color: "violet" },
            { label: "Brand", color: "pink" },
            { label: "Full-time", color: "emerald" },
        ],
    },
    {
        id: "copywriter",
        title: "Copywriter",
        description:
            "Write persuasive, on-brand copy for ads, landing pages, emails, and everything in between.",
        tags: [
            { label: "Writing", color: "blue" },
            { label: "Brand Voice", color: "pink" },
            { label: "Remote OK", color: "cyan" },
        ],
    },
    {
        id: "account-manager",
        title: "Account Manager",
        description:
            "Build lasting client relationships, manage expectations, and ensure exceptional delivery across every account.",
        tags: [
            { label: "Client Relations", color: "emerald" },
            { label: "Sales", color: "amber" },
            { label: "Full-time", color: "violet" },
        ],
    },
    {
        id: "videographer",
        title: "Videographer",
        description:
            "Shoot high-quality video content for brand campaigns, social media, and product storytelling.",
        tags: [
            { label: "Production", color: "pink" },
            { label: "Camera", color: "violet" },
            { label: "On-site", color: "amber" },
        ],
    },
    {
        id: "video-editor",
        title: "Video Editor",
        description:
            "Transform raw footage into polished, engaging videos with sharp cuts, motion graphics, and sound design.",
        tags: [
            { label: "Post-production", color: "blue" },
            { label: "Motion", color: "cyan" },
            { label: "Remote OK", color: "emerald" },
        ],
    },
];
