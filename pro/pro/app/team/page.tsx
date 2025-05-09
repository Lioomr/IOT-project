// app/team/page.tsx
import React from 'react';
// Import the updated card component (with 2:3 aspect ratio)
import TeamMemberCard from '../components/TeamMemberCard/TeamMemberCard';

// Define the structure for team members
interface Member {
  name: string;
  title: string;
  role: string;
  details?: string;
  university: string;
  imageUrl?: string; // Path should be relative to the /public folder, starting with /
}

// --- Team Data ---
const supervisor: Member = {
  name: 'Hesham Sakr',
  title: 'Doctor',
  role: 'Team Supervisor',
  university: 'El Sewedy University of Technology',
  imageUrl: '/assets/teammembers/hesham.jpeg', // Corrected path
};

const teamMembers: Member[] = [
  { name: 'Omar Abdulaal Reda', title: 'Student', role: 'Team Leader', details: 'Web developer', university: 'El Sewedy University of Technology', imageUrl: '/assets/teammembers/omar.jpeg', },
  { name: 'Mariam Khallil Ibrahim', title: 'Student', role: 'Member', details: 'Hardware collector/ Developer', university: 'El Sewedy University of Technology', imageUrl: '/assets/teammembers/mariam.jpeg', },
  { name: 'Youssef Mohammed', title: 'Student', role: 'Member', details: 'Software Developer', university: 'El Sewedy University of Technology', imageUrl: '/assets/teammembers/youssef.jpeg', },
  { name: 'Rawda Attia Mahrous', title: 'Student', role: 'Member', details: 'Software Developer/ Researcher', university: 'El Sewedy University of Technology', imageUrl: '/assets/teammembers/rawda.jpeg', },
  { name: 'Moahab Mohammed Badawy', title: 'Student', role: 'Member', details: 'Hardware researcher /collector', university: 'El Sewedy University of Technology', imageUrl: '/assets/teammembers/mohab.jpeg', },
];
// --- End of Team Data ---


export default function TeamPage() {
  return (
    // Add padding and set background for the page
    <div className="bg-gray-100 dark:bg-black min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-12 sm:mb-16 text-blue-900 dark:text-blue-300">
          Meet the GrowVision Team
        </h1>

        {/* Supervisor Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">
            Supervisor
          </h2>
          <div className="flex justify-center px-4">
            {/* CHANGED: Supervisor card now uses max-w-xs */}
            <TeamMemberCard
              {...supervisor}
              className="max-w-xs" // Max width xs (20rem / 320px)
              isSupervisor={true}
            />
          </div>
        </section>

        {/* Optional Divider */}
        <hr className="border-gray-300 dark:border-gray-700 max-w-lg mx-auto my-12 sm:my-16" />

        {/* Team Members Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">
            The Team
          </h2>
          {/* Centered Flex Wrap Layout for Team Members */}
          <div className="flex flex-wrap justify-center items-stretch gap-8 lg:gap-10">
            {teamMembers.map((member) => (
              // Render Team Member Card with max-w-xs
              <TeamMemberCard
                key={member.name}
                {...member}
                // Use max-width for consistency in flex-wrap
                className="w-full max-w-xs" // Max width xs (20rem / 320px)
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
