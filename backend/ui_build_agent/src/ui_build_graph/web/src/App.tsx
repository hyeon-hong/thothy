import { Button } from "/components/ui/button";

export default function ButtonComponent() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <Button>A normal button</Button>
            <Button variant='secondary' className='ml-4'>Secondary Button</Button>
            <Button variant='destructive' className='ml-4'>Destructive Button</Button>
            <Button variant='outline' className='ml-4'>Outline Button</Button>
            <Button variant='ghost' className='ml-4'>Ghost Button</Button>
            <Button variant='link' className='ml-4'>Link Button</Button>
        </div>
    );
}