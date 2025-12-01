import ContentLoader from "react-content-loader"
import { TableCell, TableRow } from "@/components/ui/table"

const TableSkeleton = (props: any) => {
    const rows = Array(10).fill(0)

    return (
        <>
            {rows.map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={20}
                            height={32}
                            viewBox="0 0 20 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="20" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={150}
                            height={32}
                            viewBox="0 0 150 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="150" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={200}
                            height={32}
                            viewBox="0 0 200 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="200" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={120}
                            height={32}
                            viewBox="0 0 120 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="120" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={80}
                            height={32}
                            viewBox="0 0 80 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="80" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={100}
                            height={32}
                            viewBox="0 0 100 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="100" height="20" />
                        </ContentLoader>
                    </TableCell>
                    <TableCell>
                        <ContentLoader
                            speed={2}
                            width={30}
                            height={32}
                            viewBox="0 0 30 20"
                            backgroundColor="#f3f3f3"
                            foregroundColor="#ecebeb"
                            {...props}
                        >
                            <rect x="0" y="0" rx="4" ry="4" width="30" height="20" />
                        </ContentLoader>
                    </TableCell>
                </TableRow>
            ))}
        </>
    )
}

export default TableSkeleton
