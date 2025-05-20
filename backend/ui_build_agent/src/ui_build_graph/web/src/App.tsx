import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function Calendar() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-white shadow-md p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center">
                        <Avatar>
                            <AvatarImage src="https://github.com/nutlope.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <h1 className="text-2xl font-bold ml-2">My Calendar</h1>
                    </div>
                    <Button variant='outline'>Logout</Button>
                </div>
            </header>
            <main className="flex-grow p-4 max-w-7xl mx-auto">
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="text-xl">Upcoming Events</CardTitle>
                        <CardDescription>Check your upcoming events for the month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-200 p-4 rounded-lg">
                                <h2 className="font-semibold">Event 1</h2>
                                <p>Date: 2023-10-01</p>
                            </div>
                            <div className="bg-gray-200 p-4 rounded-lg">
                                <h2 className="font-semibold">Event 2</h2>
                                <p>Date: 2023-10-05</p>
                            </div>
                            <div className="bg-gray-200 p-4 rounded-lg">
                                <h2 className="font-semibold">Event 3</h2>
                                <p>Date: 2023-10-10</p>
                            </div>
                            <div className="bg-gray-200 p-4 rounded-lg">
                                <h2 className="font-semibold">Event 4</h2>
                                <p>Date: 2023-10-15</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full">View All Events</Button>
                    </CardFooter>
                </Card>
                <div className="bg-white rounded-lg p-4 shadow-md">
                    <h2 className="text-xl font-bold mb-4">Add New Event</h2>
                    <Label htmlFor="event-name">Event Name</Label>
                    <Input id="event-name" placeholder="Enter event name" className="mb-4" />
                    <Label htmlFor="event-date">Event Date</Label>
                    <Input id="event-date" type="date" className="mb-4" />
                    <Button className="w-full">Add Event</Button>
                </div>
            </main>
            <footer className="bg-white p-4 text-center">
                <p className="text-gray-600">© 2023 Calendar App</p>
            </footer>
        </div>
    );
}