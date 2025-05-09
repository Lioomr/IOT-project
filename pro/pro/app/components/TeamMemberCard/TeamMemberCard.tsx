// app/components/TeamMemberCard/TeamMemberCard.tsx
import React from 'react';
import Image from 'next/image';

// Define the structure of the props the component expects
interface TeamMemberCardProps {
  name: string;
  title: string; // e.g., 'Doctor', 'Student'
  role: string; // e.g., 'Team Supervisor', 'Team Leader', 'Member'
  details?: string; // e.g., 'Web developer', 'Hardware researcher'
  university: string;
  imageUrl?: string; // Optional image URL
  className?: string; // Allow passing additional Tailwind classes
  isSupervisor?: boolean; // Optional flag for distinct styling
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  title,
  role,
  details,
  university,
  imageUrl,
  className = '',
  isSupervisor = false,
}) => {
  // Placeholder image URL - Adjusted for 2:3 ratio
  const placeholderImg = `https://placehold.co/300x450/E2E8F0/4A5568?text=${name.split(' ').map(n => n[0]).join('')}`; // 2:3 placeholder

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-xl shadow-lg overflow-hidden
        border ${isSupervisor ? 'border-blue-300 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700'}
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        flex flex-col text-center
        ${className}
      `}
    >
      {/* Image Area - MODIFIED FOR 2:3 ASPECT RATIO */}
      <div className={`relative w-full aspect-[2/3] overflow-hidden ${isSupervisor ? 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-950' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'}`}>
        {/* Changed aspect-square to aspect-[2/3] */}
        <Image
          src={imageUrl || placeholderImg}
          alt={`Photo of ${name}`}
          layout="fill" // Use fill to cover the container
          objectFit="cover" // Cover the area, cropping if needed
          className="transition-transform duration-300 group-hover:scale-105" // Assuming parent might be a group for hover
        />
         {/* Optional: Role overlay/badge */}
         {role && (
             <span className={`absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded ${isSupervisor ? 'bg-blue-600 text-white' : 'bg-teal-500 text-white'}`}>
                 {role}
             </span>
         )}
      </div>

      {/* Text Content Area (No changes needed here) */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg sm:text-xl font-semibold font-sans text-gray-900 dark:text-white mb-1">
          {name}
        </h3>
        <p className={`text-sm font-medium ${isSupervisor ? 'text-blue-600 dark:text-blue-400' : 'text-teal-600 dark:text-teal-400'} mb-2`}>
          {title} {details && `| ${details}`}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex-grow mb-3">
          {university}
        </p>
        {/* Optional: Add social links here */}
      </div>
    </div>
  );
};

export default TeamMemberCard;
