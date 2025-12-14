from django.core.management.base import BaseCommand
from music.models import Track
from music.lyrics_parser import update_track_lyrics

class Command(BaseCommand):
    help = 'Update lyrics for all tracks from Genius'
    
    def handle(self, *args, **options):
        self.stdout.write('🎵 Updating lyrics from Genius...')
        
        tracks_without_lyrics = Track.objects.filter(lyrics__isnull=True) | Track.objects.filter(lyrics='')
        self.stdout.write(f'Found {tracks_without_lyrics.count()} tracks without lyrics')
        
        for track in tracks_without_lyrics:
            self.stdout.write(f'Processing: {track.artist} - {track.title}')
            success = update_track_lyrics(track)
            
            if success:
                self.stdout.write(self.style.SUCCESS(f'✅ Updated: {track.title}'))
            else:
                self.stdout.write(self.style.WARNING(f'❌ Failed: {track.title}'))