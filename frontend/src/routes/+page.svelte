<script lang="ts">
  import { onMount } from 'svelte';
  import { auth, spots, getToken } from '$lib/api';
  import mapboxgl from 'mapbox-gl';
  import { createDialog } from '@melt-ui/svelte';

  const {
    elements: { trigger, overlay, content, title, description, close, portalled },
    states: { open }
  } = createDialog();

  let map: mapboxgl.Map;
  let mapContainer: HTMLDivElement;
  let isLoggedIn = false;
  let username = '';
  let password = '';
  let error = '';
  let showAgeWarning = true;
  let isOver18 = false;
  let spotsData: any[] = [];
  let selectedSpot: any = null;
  let showCreateSpot = false;
  let newSpot = {
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    privacyLevel: 'PUBLIC' as 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE',
  };

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

  onMount(() => {
    if (getToken()) {
      isLoggedIn = true;
      if (isOver18) {
        initMap();
      }
    }
  });

  function confirmAge() {
    if (isOver18) {
      showAgeWarning = false;
      if (isLoggedIn) {
        initMap();
      }
    }
  }

  async function handleLogin() {
    try {
      error = '';
      await auth.login(username, password);
      isLoggedIn = true;
      if (isOver18) {
        initMap();
      }
    } catch (e: any) {
      error = e.message || 'Login failed';
    }
  }

  function initMap() {
    if (!MAPBOX_TOKEN) {
      error = 'Mapbox token not configured';
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-9.1393, 38.7223],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      loadSpots();

      map.on('click', (e) => {
        if (showCreateSpot) {
          newSpot.latitude = e.lngLat.lat;
          newSpot.longitude = e.lngLat.lng;
        }
      });
    });
  }

  async function loadSpots() {
    try {
      const center = map.getCenter();
      const data = await spots.getNearby(center.lat, center.lng, 50);
      spotsData = data;

      spotsData.forEach((spot: any) => {
        const el = document.createElement('div');
        el.innerHTML = '📍';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';

        el.addEventListener('click', () => {
          selectedSpot = spot;
          showCreateSpot = false;
          $open = true;
        });

        new mapboxgl.Marker(el)
          .setLngLat([spot.longitude, spot.latitude])
          .addTo(map);
      });
    } catch (e: any) {
      console.error('Failed to load spots:', e);
    }
  }

  async function createSpot() {
    try {
      if (!newSpot.name || !newSpot.latitude || !newSpot.longitude) {
        error = 'Please fill in required fields';
        return;
      }

      await spots.create(newSpot);
      showCreateSpot = false;
      newSpot = { name: '', description: '', latitude: 0, longitude: 0, privacyLevel: 'PUBLIC' };
      loadSpots();
    } catch (e: any) {
      error = e.message || 'Failed to create spot';
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, sans-serif;
  }

  .container { width: 100vw; height: 100vh; }
  .map { width: 100%; height: 100%; }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .dialog {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.5rem;
    margin: 0.5rem 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  button {
    padding: 0.5rem 1rem;
    margin: 0.5rem 0.5rem 0.5rem 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-primary { background: #3b82f6; color: white; }
  .btn-secondary { background: #6b7280; color: white; }
  .error { color: #ef4444; margin: 0.5rem 0; }

  .add-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    font-size: 2rem;
    z-index: 10;
  }
</style>

<div class="container">
  {#if showAgeWarning}
    <div class="overlay">
      <div class="dialog">
        <h2>⚠️ Content Warning</h2>
        <p>F1+ Spots contains smoking-related content for adults 18+</p>
        <label>
          <input type="checkbox" bind:checked={isOver18} />
          I am 18 years or older
        </label>
        <br>
        <button class="btn-primary" disabled={!isOver18} on:click={confirmAge}>
          Continue
        </button>
      </div>
    </div>
  {:else if !isLoggedIn}
    <div class="overlay">
      <div class="dialog">
        <h2>🏎️ F1+ Spots</h2>
        <input type="text" placeholder="Username" bind:value={username} />
        <input
          type="password"
          placeholder="Password"
          bind:value={password}
          on:keypress={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button class="btn-primary" on:click={handleLogin}>Login</button>
        {#if error}
          <div class="error">{error}</div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="map" bind:this={mapContainer}></div>

    <button class="add-btn" on:click={() => (showCreateSpot = !showCreateSpot)}>+</button>

    {#if showCreateSpot}
      <div class="overlay" on:click={() => (showCreateSpot = false)}>
        <div class="dialog" on:click|stopPropagation>
          <h3>Add Spot</h3>
          <p>Click map to set location</p>
          <input type="text" placeholder="Name" bind:value={newSpot.name} />
          <textarea placeholder="Description" bind:value={newSpot.description}></textarea>
          <select bind:value={newSpot.privacyLevel}>
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS_ONLY">Friends Only</option>
            <option value="PRIVATE">Private</option>
          </select>
          {#if newSpot.latitude && newSpot.longitude}
            <p>📍 {newSpot.latitude.toFixed(4)}, {newSpot.longitude.toFixed(4)}</p>
          {/if}
          <button class="btn-primary" on:click={createSpot}>Create</button>
          <button class="btn-secondary" on:click={() => (showCreateSpot = false)}>Cancel</button>
          {#if error}<div class="error">{error}</div>{/if}
        </div>
      </div>
    {/if}

    {#if $open}
      <div use:melt={$portalled}>
        <div use:melt={$overlay} class="overlay" />
        <div use:melt={$content} class="dialog">
          <h3 use:melt={$title}>{selectedSpot?.name}</h3>
          {#if selectedSpot?.description}
            <p use:melt={$description}>{selectedSpot.description}</p>
          {/if}
          <p>📍 {selectedSpot?.latitude.toFixed(4)}, {selectedSpot?.longitude.toFixed(4)}</p>
          {#if selectedSpot?.creator}
            <p>By: {selectedSpot.creator.username}</p>
          {/if}
          <button use:melt={$close} class="btn-secondary">Close</button>
        </div>
      </div>
    {/if}
  {/if}
</div>
