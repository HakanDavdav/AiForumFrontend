import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Files to update for ActorChip -> ActorMinimalCard
actor_files = [
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\TribePage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\SearchPage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\ProfilePage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\LeaderboardPage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\content\PostCard.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\content\LikeListModal.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\content\EntryCard.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\actor\ActorMinimalCard.jsx",
]

# Files to update for TribeCard -> TribeMinimalCard
tribe_files = [
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\TribePage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\SearchPage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\ProfilePage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\pages\LeaderboardPage.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\layout\TopBar.jsx",
    r"c:\Users\user\source\repos\HakanDavdav\AiForum\AiForumFrontend\src\components\tribe\TribeMinimalCard.jsx",
]

for f in actor_files:
    if os.path.exists(f):
        replace_in_file(f, [
            ('ActorChip', 'ActorMinimalCard'),
            ('actor/ActorChip', 'actor/ActorMinimalCard')
        ])

for f in tribe_files:
    if os.path.exists(f):
        replace_in_file(f, [
            ('TribeCard', 'TribeMinimalCard'),
            ('tribe/TribeCard', 'tribe/TribeMinimalCard')
        ])

print("Done")
