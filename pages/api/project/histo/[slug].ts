// app/api/proxy/histo/[slug]/route.ts
export const dynamic = 'force-dynamic'; // defaults to auto
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: {
    body: {
        sample_location: string;
        selected_column: string;
        selected_values: string[];
    }; query: { slug: string }; headers: { authorization: string };
}, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: any }): void; new(): any } } }) => {
    const { slug } = req.query;
    const token = req.headers.authorization;
    const { sample_location, selected_column, selected_values } = req.body;

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_ENDPOINT_URL}/projects/histo/${slug}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    sample_location,
                    selected_column,
                    selected_values,
                }),
            }
        );

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export default handler;
