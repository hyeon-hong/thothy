import { Button } from "./components/ui/button";

export default function ButtonComponent() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <Button>Test Button</Button>
            <Button variant="secondary" className="ml-4">Secondary</Button>
        </div>
    );
}