import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { getGuestId } from '../utils/guest';
import { AuthService } from './auth.service';

const URL = 'http://localhost:3000';

const spotifyApiUrl = 'https://api.spotify.com/v1';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  accessToken = this.authService.getAccessToken;
  constructor(private http: HttpClient, private authService: AuthService) {}

  async createPlaylist(title: string): Promise<any> {
    try {
      const userId = await this.getUserId();
      const accessToken = this.authService.getAccessToken();
      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + accessToken
      );
      const spotifyPlaylist: any = await this.http
        .post(
          `${spotifyApiUrl}/users/${userId}/playlists`,
          { name: title },
          { headers }
        )
        .toPromise();

      return await firstValueFrom(
        this.http.post(`${URL}/api/playlist/create`, {
          title,
          spotifyPlaylistId: spotifyPlaylist?.id,
        })
      );
    } catch (error) {
      console.error('Failed to create playlist', error);
      throw error;
    }
  }

  async getUserId(): Promise<string> {
    try {
      const accessToken = this.authService.getAccessToken();
      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + accessToken
      );
      const response: any = await this.http
        .get(`${spotifyApiUrl}/me`, { headers })
        .toPromise();
      return response.id;
    } catch (error) {
      console.error('Failed to get user ID', error);
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get(`${URL}/api/playlist/${playlistId}`)
      );
    } catch (error) {
      console.error('Failed to get playlist', error);
      throw error;
    }
  }

  async addTrackToPlaylist(playlistId: string, trackId: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${playlistId}/add-track`, {
          trackId,
        })
      );
    } catch (error) {
      console.error('Failed to add track to playlist', error);
      throw error;
    }
  }

  async voteForTrack(
    playlistId: string,
    trackId: string,
    spotifyId: string
  ): Promise<void> {
    try {
      const guestId = getGuestId();
      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${playlistId}/vote`, {
          trackId,
          guestId,
          spotifyId,
        })
      );
    } catch (error) {
      console.error('Failed to vote for track', error);
      throw error;
    }
  }

  async deleteVote(
    playlistId: string,
    trackId: string,
    spotifyId: string
  ): Promise<void> {
    try {
      const guestId = getGuestId();

      await firstValueFrom(
        this.http.post(`${URL}/api/playlist/${playlistId}/vote`, {
          trackId,
          guestId,
          spotifyId,
        })
      );
    } catch (error) {
      console.error('Failed to delete vote', error);
      throw error;
    }
  }

  async reorderSpotifyPlaylist(
    playlistId: string,
    orderedTracks: any[]
  ): Promise<void> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) {
      console.warn('No access token found. Cannot reorder Spotify playlist.');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${accessToken}`
    );

    try {
      // Get the current Spotify playlist tracks
      const currentTracks$: Observable<any> = this.http.get(
        `${spotifyApiUrl}/playlists/${playlistId}/tracks`,
        { headers }
      );

      const currentTracks = await firstValueFrom(currentTracks$);
      const currentTrackUris = currentTracks.items.map(
        (item: any) => item.track.uri
      );

      // Calculate the new track order
      const newTrackOrder = orderedTracks.map((track: any) =>
        currentTrackUris.indexOf(track.spotifyId)
      );

      // Reorder the tracks
      await firstValueFrom(
        this.http.put(
          `${spotifyApiUrl}/playlists/${playlistId}/tracks`,
          { uris: newTrackOrder },
          { headers }
        )
      );
    } catch (error) {
      console.error('Failed to reorder Spotify playlist', error);
      throw error;
    }
  }
}