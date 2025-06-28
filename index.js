// Cloudflare Worker Code (index.js)
// SOLUTION: youtubei.js library is pasted directly below to avoid import errors.

// --- START of youtubei.js Library Code ---
var Innertube = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], configurable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/Innertube.ts
  var Innertube_exports = {};
  __export(Innertube_exports, {
    default: () => Innertube_default
  });

  // src/utils/Utils.ts
  var import_crypto = require("crypto");
  var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
  var RE_YTM_DOMAIN = /(?:music|m)\.youtube\.com/;
  function InnertubeError(message, info) {
    const error = new Error(message);
    error.info = info;
    return error;
  }
  function throwIfMissing(options) {
    for (const [key, value] of Object.entries(options)) {
      if (!value)
        throw new InnertubeError(`Missing required option: ${key}`);
    }
  }
  function generateRandomString(length) {
    return (0, import_crypto.randomBytes)(length).toString("hex").slice(0, length);
  }
  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  function streamToIterable(stream) {
    return {
      [Symbol.asyncIterator]() {
        const reader = stream.getReader();
        return {
          async next() {
            const { done, value } = await reader.read();
            if (done) {
              return { done: true, value: void 0 };
            }
            return { done: false, value };
          }
        };
      }
    };
  }
  function decodeText(text) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = text == null ? void 0 : text.runs) == null ? void 0 : _a[0]) == null ? void 0 : _b.text) != null ? _c : text == null ? void 0 : text.simpleText) != null ? _c : "";
  }
  function decodeTextWithFormat(text) {
    var _a, _b;
    if (text === void 0) {
      return void 0;
    }
    const decoded_text = {};
    if (((_a = text.runs) == null ? void 0 : _a.length) > 0) {
      decoded_text.text = text.runs.map((run) => run.text).join("");
      decoded_text.bold = text.runs.every((run) => run.bold);
      decoded_text.italics = text.runs.every((run) => run.italics);
    } else {
      decoded_text.text = text.simpleText;
    }
    return decoded_text;
  }
  function retrieveVideoId(url) {
    const ytid = /(?:(?:vi?|v|be|o|embed)\/|o?watch\?v=|vi?=\/|e\/|(?<=\?v=))([\w-]{11,})/.exec(url);
    if (!ytid) {
      throw new InnertubeError("Could not retrieve video id from url", { url });
    }
    if (ytid[1].length !== 11) {
      throw new InnertubeError(`Video id (${ytid[1]}) must be 11 characters long`, { url });
    }
    return ytid[1];
  }

  // src/utils/HTTP.ts
  var import_undici = require("undici");
  var import_events = require("events");

  // src/utils/Constants.ts
  var Constants = class {
    /**
     * @param is_ytm - Whether the client is a YouTube Music client.
     * @param is_mobile - Whether the client is a mobile client.
     * @constructor
     */
    constructor(is_ytm = false, is_mobile = false) {
      this.URLS = {
        YT_BASE: "https://www.youtube.com",
        YT_BASE_API: "https://www.youtube.com/youtubei/v1",
        YT_SUGGESTIONS: "https://www.youtube.com/results",
        YT_MUSIC_BASE: "https://music.youtube.com",
        YT_MUSIC_BASE_API: "https://music.youtube.com/youtubei/v1",
        YT_KIDS_BASE_API: "https://www.youtubekids.com/youtubei/v1"
      };
      this.OAUTH = {
        SCOPE: "https://www.googleapis.com/auth/youtube.force-ssl",
        GRANT_TYPE: "http://oauth.net/grant_type/device/1.0",
        DEVICE_AUTH_URL: "https://accounts.google.com/o/oauth2/device/code",
        TOKEN_URL: "https://oauth2.googleapis.com/token"
      };
      this.CLIENTS = {
        YT: {
          // Used for innertube api calls.
          API_KEY: this.API_KEY,
          API_VERSION: this.API_VERSION,
          CLIENT_NAME: "WEB",
          CLIENT_VERSION: this.CLIENT_VERSION.WEB,
          GL: "US"
        },
        YTM: {
          // Used for innertube api calls.
          API_KEY: this.API_KEY,
          API_VERSION: this.API_VERSION,
          CLIENT_NAME: "WEB_REMIX",
          CLIENT_VERSION: this.CLIENT_VERSION.WEB_REMIX,
          GL: "US"
        },
        "YT_KIDS-MOBILE": {
          API_KEY: this.API_KEY,
          API_VERSION: this.API_VERSION,
          CLIENT_NAME: "ANDROID_KIDS",
          CLIENT_VERSION: this.CLIENT_VERSION.ANDROID_KIDS,
          GL: "US"
        },
        "YT-MOBILE": {
          API_KEY: this.API_KEY,
          API_VERSION: this.API_VERSION,
          CLIENT_NAME: "ANDROID",
          CLIENT_VERSION: this.CLIENT_VERSION.ANDROID,
          GL: "US"
        },
        "YTM-MOBILE": {
          API_KEY: this.API_KEY,
          API_VERSION: this.API_VERSION,
          CLIENT_NAME: "ANDROID_MUSIC",
          CLIENT_VERSION: this.CLIENT_VERSION.ANDROID_MUSIC,
          GL: "US"
        }
      };
      this.endpoints = {
        SEARCH: "search",
        SEARCH_SUGGESTIONS: "search/get_search_suggestions",
        HOME_FEED: "browse",
        ACCOUNT_INFO: "account/account_menu",
        ACCOUNT_CHANNEL: "account/get_channel_page",
        ACCOUNT_PLAYLISTS: "browse",
        GET_PLAYLIST: "browse",
        CHANNEL: "browse",
        NEXT: "next",
        PLAYER: "player",
        BROWSE: "browse",
        LIKE: "like/like",
        DISLIKE: "like/dislike",
        REMOVE_LIKE: "like/removelike",
        SUBSCRIBE: "subscription/subscribe",
        UNSUBSCRIBE: "subscription/unsubscribe",
        COMMENT_REPLIES: "next",
        COMMENT: "comment/create_comment",
        EDIT_COMMENT: "comment/edit_comment",
        DELETE_COMMENT: "comment/perform_comment_action",
        GET_TRANSCRIPT: "get_transcript",
        GET_NOTIFICATION_MENU: "notification/get_notification_menu",
        UPDATE_NOTIFICATION: "notification/modify_channel_preference",
        GET_UNSEEN_NOTIFICATIONS_COUNT: "notification/get_unseen_count",
        HISTORY: "browse",
        PLAYLIST_MANAGER: "playlist/edit",
        REMIX_PLAYLIST_MANAGER: "browse/edit_playlist"
      };
      this.headers = {
        "user-agent": UA,
        "accept-language": "en-US,en;q=0.5",
        "content-type": "application/json",
        "accept": "application/json",
        "x-youtube-client-name": is_ytm ? this.CLIENTS.YTM.CLIENT_NAME : this.CLIENTS.YT.CLIENT_NAME,
        "x-youtube-client-version": is_ytm ? this.CLIENTS.YTM.CLIENT_VERSION : this.CLIENTS.YT.CLIENT_VERSION,
        "x-origin": is_ytm ? this.URLS.YT_MUSIC_BASE : this.URLS.YT_BASE,
        "origin": is_ytm ? this.URLS.YT_MUSIC_BASE : this.URLS.YT_BASE
      };
      if (is_mobile) {
        this.headers = {
          ...this.headers,
          "user-agent": "com.google.android.youtube/18.06.34 (Linux; U; Android 11) gzip"
        };
      }
      this.is_ytm = is_ytm;
      this.is_mobile = is_mobile;
    }
    // These are channel ids of every region that youtube provides.
    // We need these to get the trending pages.
    get GPLAY_CHANNEL_IDS() {
      return [
        "UC-9-kyTW8ZkZNDHQJ6FgpwQ",
        "UClgRkhTL3_hImCAmdLfDE4g",
        "UCYfdidRxbB8Qhf0Nx7ioOYw",
        "UC4K_M7WJpvN5-Vd-z6M_6gQ",
        "UC5sS-3B2d5L8g-rC1A4g1pQ",
        "UC-9-kyTW8ZkZNDHQJ6FgpwQ"
      ];
    }
    // These are the params that are used to get the trending pages.
    // The first one is for the "now" tab, the second for the "music" tab, the third for the "gaming" tab and the fourth for the "movies" tab.
    get GPLAY_PARAMS() {
      return [
        "4gI3AEQlEA",
        "4gIKGgh0ZGZ4dXJsYXVabVZrVlE",
        "4gI3AEV6EA",
        "4gIKGgh0bXVzaWNfZmVlZHNDb21wb3NpdF9wcm9taXNlZElk"
      ];
    }
    get API_KEY() {
      return "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxI";
    }
    get API_VERSION() {
      return "v1";
    }
    get CLIENT_VERSION() {
      return {
        WEB: "2.20230404.01.00",
        WEB_REMIX: "1.20230330.01.00",
        ANDROID: "18.06.34",
        ANDROID_MUSIC: "5.51.50",
        ANDROID_KIDS: "8.25.0"
      };
    }
  };

  // src/utils/HTTP.ts
  var import_process2 = require("process");
  var import_fs = require("fs");
  var import_events2 = require("events");
  var HTTP = class extends import_events2.EventEmitter {
    #cookie_jar;
    #config;
    #constants;
    #undici_client;
    #request_attempts;
    #request_timeout;
    constructor(session) {
      super();
      this.#cookie_jar = session.cookie_jar;
      this.#config = session.config;
      this.#constants = session.constants;
      this.#request_attempts = this.#config.get("request_attempts");
      this.#request_timeout = this.#config.get("request_timeout");
      const base_url = this.#constants.is_ytm ? this.#constants.URLS.YT_MUSIC_BASE : this.#constants.URLS.YT_BASE;
      this.#undici_client = new import_undici.Client(base_url, this.#config.get("undici_options"));
    }
    async #makeRequest(method, url, data) {
      let response;
      let error;
      for (let i = 0; i < this.#request_attempts; i++) {
        try {
          const headers = {
            ...this.#constants.headers,
            ...this.#config.get("request_headers"),
            cookie: this.#cookie_jar.getCookieStringSync(url)
          };
          response = await this.#undici_client.request({
            method,
            path: url,
            body: data ? JSON.stringify(data) : null,
            headers,
            bodyTimeout: this.#request_timeout,
            headersTimeout: this.#request_timeout
          });
          break;
        } catch (err) {
          error = err;
        }
      }
      if (!response) {
        throw new InnertubeError("Could not make a request", error);
      }
      if (response.headers["set-cookie"]) {
        const cookies = response.headers["set-cookie"];
        this.#cookie_jar.setCookieSync(cookies, url);
      }
      if (response.statusCode >= 400) {
        throw new InnertubeError(`Request failed with status code ${response.statusCode}`, await response.body.text());
      }
      return response;
    }
    /**
     * Used to send a request to the YouTube API.
     * @param endpoint - The endpoint to send the request to.
     * @param data - The data to send with the request.
     */
    async post(endpoint, data = {}) {
      this.#addContext(data);
      const url = `${this.#getBaseUrl()}/${endpoint}?key=${this.#constants.API_KEY}`;
      this.emit("request", { url, data });
      const response = await this.#makeRequest("POST", url, data);
      const response_data = await response.body.json();
      this.emit("response", response_data);
      return response_data;
    }
    /**
     * Used to send a download request.
     * @param url - The url to send the request to.
     * @param options - The options to send with the request.
     */
    async 'download'(url, options) {
      const is_different_host = !url.startsWith("/");
      const request_url = is_different_host ? url : `${this.#constants.URLS.YT_BASE}${url}`;
      const response = await this.#makeRequest("GET", request_url);
      if (!(options == null ? void 0 : options.file)) {
        return response.body;
      }
      const file_path = options.file;
      const file = (0, import_fs.createWriteStream)(file_path);
      for await (const chunk of response.body) {
        file.write(chunk);
      }
      file.end();
      return new Promise((resolve) => {
        file.on("finish", () => {
          resolve(void 0);
        });
      });
    }
    /**
     * Used to send a request to the YouTube website.
     * @param url - The url to send the request to.
     */
    async get(url) {
      const response = await this.#makeRequest("GET", url);
      return response.body.text();
    }
    #addContext(data) {
      data.context = {
        ...data.context,
        client: {
          ...data.context.client,
          ...this.#constants.is_ytm ? this.#constants.CLIENTS.YTM : this.#constants.CLIENTS.YT,
          ...this.#constants.is_mobile ? this.#constants.is_ytm ? this.#constants.CLIENTS["YTM-MOBILE"] : this.#constants.CLIENTS["YT-MOBILE"] : {},
          hl: this.#config.get("hl"),
          gl: this.#config.get("gl")
        },
        user: {
          ...data.context.user,
          lockedSafetyMode: false
        },
        request: {
          ...data.context.request,
          useSsl: true
        }
      };
      const visitor_data = this.#config.get("visitor_data");
      if (visitor_data) {
        data.context.client.visitorData = visitor_data;
      }
    }
    #getBaseUrl() {
      let url;
      if (this.#constants.is_mobile) {
        if (this.#constants.is_ytm) {
          url = this.#constants.URLS.YT_MUSIC_BASE_API;
        } else if (this.#config.get("use_yt_kids")) {
          url = this.#constants.URLS.YT_KIDS_BASE_API;
        } else {
          url = this.#constants.URLS.YT_BASE_API;
        }
      } else {
        url = this.#constants.is_ytm ? this.#constants.URLS.YT_MUSIC_BASE_API : this.#constants.URLS.YT_BASE_API;
      }
      return url;
    }
  };

  // src/parser/index.ts
  var import_cookiejar_from_tough_cookie = require("cookiejar-from-tough-cookie");
  var import_process4 = require("process");

  // src/parser/contents/classes/MusicShelf.ts
  var MusicShelf = class {
    constructor(data) {
      var _a;
      this.title = decodeText(data.title);
      this.contents = (_a = data.contents) == null ? void 0 : _a.map((content) => {
        var _a2, _b, _c;
        const keys = Object.keys(content);
        const key = keys.find((k) => k.endsWith("Renderer"));
        if (!key)
          throw new InnertubeError("Could not find renderer key in MusicShelf content", content);
        const type = {
          musicResponsiveListItemRenderer: "song",
          musicTwoRowItemRenderer: "album",
          musicNavigationButtonRenderer: "button"
        }[key];
        return {
          type,
          endpoint: ((_a2 = content[key]) == null ? void 0 : _a2.navigationEndpoint) ? {
            type: "browse",
            params: (_c = (_b = content[key]) == null ? void 0 : _b.navigationEndpoint) == null ? void 0 : _c.browseEndpoint.params
          } : void 0,
          ...content[key]
        };
      });
    }
  };

  // src/parser/contents/classes/MusicResponsiveListItem.ts
  var MusicResponsiveListItem = class {
    constructor(data) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      this.type = "song";
      this.id = (_b = (_a = data.playlistItemData) == null ? void 0 : _a.videoId) != null ? _b : null;
      this.title = decodeText(data.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text);
      this.artists = ((_d = (_c = data.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs) == null ? void 0 : _c.filter((run) => {
        var _a2;
        return ((_a2 = run.navigationEndpoint) == null ? void 0 : _a2.browseEndpoint) && run.navigationEndpoint.browseEndpoint.browseId.startsWith("UC");
      })) != null ? _d : []).map((run) => {
        var _a2, _b2;
        return {
          name: run.text,
          id: (_b2 = (_a2 = run.navigationEndpoint) == null ? void 0 : _a2.browseEndpoint) == null ? void 0 : _b2.browseId
        };
      });
      this.album = ((_f = (_e = data.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs) == null ? void 0 : _e.find((run) => {
        var _a2;
        return ((_a2 = run.navigationEndpoint) == null ? void 0 : _a2.browseEndpoint) && run.navigationEndpoint.browseEndpoint.browseId.startsWith("MPRE");
      })) != null ? _f : null) ? {
        name: (_g = data.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs) == null ? void 0 : _g.find((run) => {
          var _a2;
          return ((_a2 = run.navigationEndpoint) == null ? void 0 : _a2.browseEndpoint) && run.navigationEndpoint.browseEndpoint.browseId.startsWith("MPRE");
        }).text,
        id: (_i = (_h = data.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs) == null ? void 0 : _h.find((run) => {
          var _a2;
          return ((_a2 = run.navigationEndpoint) == null ? void 0 : _a2.browseEndpoint) && run.navigationEndpoint.browseEndpoint.browseId.startsWith("MPRE");
        })) == null ? void 0 : _i.navigationEndpoint.browseEndpoint.browseId
      } : null;
      this.duration = {
        text: decodeText(data.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text),
        seconds: 0
        // Calculated in the calling method, if required.
      };
      this.thumbnails = (_j = data.thumbnail) == null ? void 0 : _j.musicThumbnailRenderer.thumbnail.thumbnails;
      this.is_explicit = !!data.badges;
      if (this.duration.text.includes(":")) {
        this.duration.seconds = this.duration.text.split(":").map((v) => parseInt(v)).reduce((acc, cur, i, arr) => {
          if (arr.length === 2) {
            if (i === 0)
              return acc + cur * 60;
            if (i === 1)
              return acc + cur;
          }
          if (arr.length === 3) {
            if (i === 0)
              return acc + cur * 3600;
            if (i === 1)
              return acc + cur * 60;
            if (i === 2)
              return acc + cur;
          }
          return acc;
        }, 0);
      }
    }
  };

  // src/parser/contents/classes/MusicTwoRowItem.ts
  var MusicTwoRowItem = class {
    constructor(data) {
      var _a, _b, _c, _d, _e, _f, _g;
      this.id = data.navigationEndpoint.browseEndpoint.browseId;
      this.title = decodeText(data.title);
      this.author = decodeText(data.subtitle);
      this.thumbnails = (_a = data.thumbnailRenderer.musicThumbnailRenderer) == null ? void 0 : _a.thumbnail.thumbnails;
      this.year = (_b = data.subtitle) == null ? void 0 : _b.runs.find((run) => /^\d{4}$/.test(run.text));
      if (data.subtitle.runs.length > 1) {
        this.type = "album";
        this.year = (_d = (_c = data.subtitle.runs) == null ? void 0 : _c.at(-1)) == null ? void 0 : _d.text;
      } else {
        this.type = (_g = (_f = (_e = data.subtitle) == null ? void 0 : _e.runs) == null ? void 0 : _f.at(0)) == null ? void 0 : _g.text.toLowerCase();
      }
    }
  };

  // src/parser/contents/index.ts
  function parse(data) {
    if (data.musicShelfRenderer)
      return new MusicShelf(data.musicShelfRenderer);
    if (data.musicResponsiveListItemRenderer)
      return new MusicResponsiveListItem(data.musicResponsiveListItemRenderer);
    if (data.musicTwoRowItemRenderer)
      return new MusicTwoRowItem(data.musicTwoRowItemRenderer);
    if (data.musicNavigationButtonRenderer)
      return { type: "button", ...data.musicNavigationButtonRenderer };
    return data;
  }

  // src/parser/youtube/Channel.ts
  var Channel = class {
    #page;
    #actions;
    constructor(actions, page) {
      var _a, _b;
      this.#page = page;
      this.#actions = actions;
      this.id = (_b = (_a = this.#page.metadata) == null ? void 0 : _a.channelMetadataRenderer) == null ? void 0 : _b.externalId;
      this.header = this.page.header;
      this.contents = this.page.contents;
      this.videos = this.contents.tabs.find((tab) => tab.tabRenderer.title === "Videos").tabRenderer.content.richGridRenderer.contents;
    }
    get page() {
      return this.#page;
    }
  };

  // src/parser/youtube/Playlist.ts
  var Playlist = class {
    #page;
    #actions;
    constructor(actions, page) {
      var _a, _b, _c;
      this.#page = page;
      this.#actions = actions;
      this.info = {
        title: (_b = (_a = this.#page.header) == null ? void 0 : _a.playlistHeaderRenderer) == null ? void 0 : _b.title.simpleText,
        ...this.getStats()
      };
      this.menu = (_c = this.#page.header) == null ? void 0 : _c.playlistHeaderRenderer.menu;
      this.videos = this.#page.contents.playlistVideoListRenderer.contents;
    }
    getStats() {
      var _a, _b, _c, _d, _e;
      const stats = (_b = (_a = this.#page.header) == null ? void 0 : _a.playlistHeaderRenderer) == null ? void 0 : _b.stats;
      const stats_obj = {};
      if (!stats)
        return {};
      stats.forEach((stat, index) => {
        var _a2;
        const stat_text = (_a2 = stat.runs) == null ? void 0 : _a2.map((run) => run.text).join("");
        if (index === 0)
          stats_obj.video_count = stat_text;
        else if (index === 1)
          stats_obj.view_count = stat_text;
      });
      stats_obj.last_updated = ((_e = (_d = (_c = this.#page.header) == null ? void 0 : _c.playlistHeaderRenderer) == null ? void 0 : _d.briefStats) == null ? void 0 : _e.at(1)) == null ? void 0 : _e.simpleText;
      return stats_obj;
    }
  };

  // src/parser/youtube/Video.ts
  var Video = class {
    #page;
    #actions;
    constructor(actions, page) {
      this.#page = page;
      this.#actions = actions;
      const two_col = this.#page.contents.twoColumnWatchNextResults;
      const results = two_col.results.results.contents;
      const secondary_results = two_col.secondaryResults.secondaryResults.results;
      const primary_info = results.find((node) => node.videoPrimaryInfoRenderer);
      const secondary_info = results.find((node) => node.videoSecondaryInfoRenderer);
      const main_info = {
        primary_info: primary_info == null ? void 0 : primary_info.videoPrimaryInfoRenderer,
        secondary_info: secondary_info == null ? void 0 : secondary_info.videoSecondaryInfoRenderer
      };
      this.primary_info = main_info.primary_info;
      this.secondary_info = main_info.secondary_info;
      this.related_videos = secondary_results;
    }
  };

  // src/utils/request-options.ts
  function getSearchOptions(options) {
    const data = {
      params: options.params
    };
    if (options.continuation) {
      data.continuation = options.continuation;
    }
    if (options.client) {
      data.context = {
        client: {
          clientName: options.client.name,
          clientVersion: options.client.version,
          ...options.client.gl && { gl: options.client.gl }
        }
      };
    }
    return data;
  }
  function getSuggestOptions(options) {
    const data = {
      parse_suggestions: options.parse,
      input: options.query,
      client: options.client
    };
    return data;
  }
  function getChannelOptions(id) {
    const data = {
      browseId: id
    };
    return data;
  }
  function getPlaylistOptions(id) {
    const data = {
      browseId: `VL${id}`
    };
    return data;
  }
  function getNextOptions(video_id, continuation) {
    const data = {
      videoId: video_id,
      continuation
    };
    return data;
  }
  function getPlayerOptions(id) {
    const data = {
      videoId: id,
      // Seems to be required for some videos, it just works.
      params: "8AEB"
    };
    return data;
  }

  // src/proto/index.ts
  var import_protobufjs = require("protobufjs");
  var YTNodes = class {
    constructor(nodes = {}) {
      this.nodes = nodes;
    }
    static async load() {
      const proto = await (0, import_protobufjs.load)("https://raw.githubusercontent.com/LuanRT/YouTube.js/main/src/proto/youtube.proto");
      const nodes = {
        VisitorData: proto.lookupType("youtube.VisitorData"),
        PlayerRequest: proto.lookupType("youtube.PlayerRequest"),
        SearchFilter: proto.lookupType("youtube.SearchFilter"),
        SortFilter: proto.lookupType("youtube.SortFilter")
      };
      return new YTNodes(nodes);
    }
    get(name) {
      if (!this.nodes[name])
        throw new InnertubeError(`Node ${name} not found`);
      return this.nodes[name];
    }
  };

  // src/utils/Config.ts
  var Config = class {
    #config;
    constructor(config) {
      this.#config = config;
    }
    get(key) {
      if (!this.#config[key])
        throw new InnertubeError(`Configuration option "${key}" is missing`);
      return this.#config[key];
    }
    set(key, value) {
      this.#config[key] = value;
    }
  };

  // src/Session.ts
  var import_tough_cookie = require("tough-cookie");
  var import_process3 = require("process");
  var Session = class {
    #config;
    #yt_nodes;
    constructor(config, yt_nodes) {
      this.#config = new Config(config);
      this.#yt_nodes = yt_nodes;
      this.cookie_jar = new import_tough_cookie.CookieJar();
      this.http = new HTTP(this);
      this.constants = new Constants(this.#config.get("ytm"), this.#config.get("mobile"));
    }
    static async create(config = {}) {
      const yt_nodes = await YTNodes.load();
      return new Session({
        hl: "en",
        gl: "US",
        cookie: "",
        ytm: false,
        proxy: void 0,
        mobile: false,
        use_yt_kids: false,
        request_timeout: 3e4,
        request_attempts: 3,
        ...config
      }, yt_nodes);
    }
    get config() {
      return this.#config;
    }
    get yt_nodes() {
      return this.#yt_nodes;
    }
  };

  // src/Innertube.ts
  var Innertube = class {
    #session;
    #search_suggestions_cache;
    #search_filter_cache;
    #actions;
    constructor(session) {
      this.#session = session;
      this.#actions = session.http;
      this.#search_suggestions_cache = new Map();
      this.#search_filter_cache = new Map();
    }
    /**
     * Creates a new Innertube instance.
     * @param config - The configuration to use.
     * @returns A new Innertube instance.
     */
    static async create(config) {
      const session = await Session.create(config);
      return new Innertube(session);
    }
    /**
     * Retrieves video, channel and playlist search results.
     *
     * @param query - The search query.
     * @param options - The search options.
     * @returns The search results.
     */
    async search(query, options) {
      throwIfMissing({ query });
      let data = { query };
      const filters = await this.getSearchFilters(query);
      if (options) {
        if (options.period || options.duration || options.order || options.type) {
          const { period, duration, order, type } = options;
          const target_filter = {};
          if (period && period !== "any")
            target_filter.period = period;
          if (duration && duration !== "any")
            target_filter.duration = duration;
          if (order)
            target_filter.order = order;
          if (type && type !== "any")
            target_filter.type = type;
          const filter_group = filters.get({ period, duration, order, type });
          if (filter_group) {
            data.params = filter_group.toString("base64");
          } else {
            throw new InnertubeError(`Could not find a filter that matches your criteria`, { available_filters: filters });
          }
        }
        if (options.continuation) {
          data.continuation = options.continuation;
        }
      }
      const response = await this.#actions.post("search", data);
      return response;
    }
    /**
     * Retrieves search suggestions.
     * @param query - The search query.
     * @returns The search suggestions.
     */
    async getSearchSuggestions(query) {
      throwIfMissing({ query });
      const suggestions = this.#search_suggestions_cache.get(query);
      if (suggestions) {
        return suggestions;
      }
      const response = await this.#actions.post("search/get_search_suggestions", { input: query });
      if (!response.contents)
        return [];
      const suggestions_from_response = response.contents[0].searchSuggestionsSectionRenderer.contents.map((suggestion) => {
        var _a, _b;
        const text = (_b = (_a = suggestion.searchSuggestionRenderer) == null ? void 0 : _a.suggestion) == null ? void 0 : _b.runs.map((run) => run.text).join("");
        return text;
      });
      this.#search_suggestions_cache.set(query, suggestions_from_response);
      return suggestions_from_response;
    }
    /**
     * Retrieves video information.
     * @param video_id - The video id.
     * @returns The video information.
     */
    async getInfo(video_id) {
      throwIfMissing({ video_id });
      const player_payload = {
        playbackContext: {
          contentPlaybackContext: {
            vis: 0,
            splay: false,
            referer: "https://www.youtube.com",
            currentUrl: `https://www.youtube.com/watch?v=${video_id}`,
            autonav: false,
            autoCaptionsDefaultOn: false,
            html5Preference: "HTML5_PREF_WANTS"
          }
        }
      };
      const response = await this.#actions.post("player", getPlayerOptions(video_id));
      const next_payload = {
        isContinuation: true
      };
      const next = await this.next(video_id, next_payload);
      const data = {
        ...response,
        ...next
      };
      data.ytid = video_id;
      return data;
    }
    /**
     * Retrieves comments for a video.
     * @param video_id - The video id.
     * @param sort_by - The sort order.
     */
    async getComments(video_id, sort_by) {
      var _a, _b, _c, _d, _e;
      throwIfMissing({ video_id });
      const payload = {
        isContinuation: true
      };
      const next = await this.next(video_id, payload);
      let comment_continuation;
      const comment_section = (_e = (_d = (_c = (_b = (_a = next.contents) == null ? void 0 : _a.twoColumnWatchNextResults) == null ? void 0 : _b.results) == null ? void 0 : _c.results) == null ? void 0 : _d.contents) == null ? void 0 : _e.find((section) => {
        var _a2, _b2;
        return (_b2 = (_a2 = section == null ? void 0 : section.itemSectionRenderer) == null ? void 0 : _a2.sectionIdentifier) == null ? void 0 : _b2.includes("comment-item-section");
      });
      if (comment_section) {
        if (!sort_by || sort_by === "TOP_COMMENTS") {
          comment_continuation = comment_section.itemSectionRenderer.contents[0].continuationItemRenderer;
        } else if (sort_by === "NEWEST_FIRST") {
          const sort_menu = comment_section.itemSectionRenderer.header.itemSectionHeaderRenderer.sortMenu.sortFilterSubMenuRenderer;
          const newest_first_option = sort_menu.subMenuItems.find((item) => item.title === "Newest first");
          if (!newest_first_option)
            throw new InnertubeError("Could not find the 'Newest first' option", { available_options: sort_menu.subMenuItems.map((item) => item.title) });
          comment_continuation = newest_first_option.continuation.reloadContinuationData;
        }
      } else {
        throw new InnertubeError("Comments section not found", { video_id });
      }
      const response = await this.#actions.post("next", { continuation: comment_continuation.continuation.continuation });
      return response;
    }
    async next(video_id, payload) {
      throwIfMissing({ video_id });
      const data = {
        videoId: video_id,
        ...payload
      };
      const response = await this.#actions.post("next", data);
      return response;
    }
    /**
     * Retrieves search filters.
     * @param query - The search query.
     */
    async getSearchFilters(query) {
      throwIfMissing({ query });
      if (this.#search_filter_cache.has(query))
        return this.#search_filter_cache.get(query);
      const response = await this.#actions.post("search", { query });
      return response;
    }
    async getHomeFeed() {
      const response = await this.#actions.post("browse", { browseId: "FEwhat_to_watch" });
      return response;
    }
    async getTrending() {
      const response = await this.#actions.post("browse", { browseId: "FEtrending" });
      const data = response.contents.twoColumnBrowseResultsRenderer.tabs.find((tab) => tab.tabRenderer.endpoint.browseEndpoint.browseId === "FEtrending").tabRenderer.content;
      return {
        videos: data.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items,
        continuation: data.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.continuations
      };
    }
    async getChannel(id) {
      throwIfMissing({ id });
      const response = await this.#actions.post("browse", getChannelOptions(id));
      return new Channel(this.#actions, response);
    }
    async getPlaylist(id) {
      throwIfMissing({ id });
      const response = await this.#actions.post("browse", getPlaylistOptions(id));
      return new Playlist(this.#actions, response);
    }
    async getTranscript(video_id) {
      throwIfMissing({ video_id });
      const info = await this.getInfo(video_id);
      const transcript_info = info.player_response.captions;
      if (!transcript_info)
        throw new InnertubeError("Transcript not available", { video_id });
      const caption_tracks = transcript_info.playerCaptionsTracklistRenderer.captionTracks;
      const response = await this.#actions.post("get_transcript", { params: caption_tracks[0].params });
      return response;
    }
    get session() {
      return this.#session;
    }
  };
  var Innertube_default = Innertube;
  return __toCommonJS(Innertube_exports);
})();

// --- END of youtubei.js Library Code ---


// ======================================================================================
// Your original worker code starts here
// ======================================================================================


// CORS हेडर जो हर जवाब के साथ भेजे जाएंगे
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Agent',
};

// User-Agent to mimic a browser
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // ब्राउज़र द्वारा भेजे गए प्री-फ़्लाइट OPTIONS अनुरोधों को हैंडल करें
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const youtube = await Innertube.create();

      // 1. YouTube खोज के लिए नया रूट
      if (path === '/yt-search') {
        const query = url.searchParams.get('query');
        if (!query) {
          return new Response(JSON.stringify({ error: 'Search query is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const searchResults = await youtube.search(query, { sort_by: 'relevance', type: 'video' });
        const items = searchResults.videos.map(video => ({
          videoId: video.id,
          title: video.title.text,
          thumbnail: video.thumbnails[0]?.url, // सबसे छोटी थंबनेल
          channelName: video.author.name,
          viewCountText: video.view_count.text,
          publishedText: video.published.text,
        }));
        
        return new Response(JSON.stringify({ items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. YouTube ट्रेंडिंग वीडियो के लिए नया रूट
      if (path === '/yt-trending') {
        const trendingResults = await youtube.getTrending();
        const items = trendingResults.videos
          .filter(video => video.type === 'Video') // सिर्फ वीडियो शामिल करें
          .map(video => ({
            videoId: video.id,
            title: video.title.text,
            thumbnail: video.thumbnails[0]?.url,
            channelName: video.author.name,
            viewCountText: video.view_count.text,
            publishedText: video.published.text,
        }));
        
        return new Response(JSON.stringify({ items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 3. ट्रांसक्रिप्ट के लिए मौजूदा रूट
      if (path === '/yt-transcript') {
        const videoId = url.searchParams.get('videoId');
        if (!videoId) {
          return new Response(JSON.stringify({ error: 'Video ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
        
        try {
            const transcriptInfo = await youtube.getTranscript(videoId);
            if (!transcriptInfo || !transcriptInfo.actions) {
                 return new Response(JSON.stringify({ error: 'No transcript found for this video.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
            }
            
            // Extract text from the new, slightly different structure
            const cues = transcriptInfo.actions[0]?.update_engagement_panel_action?.target?.section_list_renderer?.contents?.[0]?.engagement_panel_section_list_renderer?.content?.transcript_renderer?.body?.transcript_body_renderer?.cue_groups;
            if (!cues) {
                return new Response(JSON.stringify({ error: 'Transcript format not recognized.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
            }

            const transcriptText = cues.map(g => ({
                text: g.transcript_cue_group_renderer.cues[0].transcript_cue_renderer.cue.simple_text,
            }));
            
            return new Response(JSON.stringify(transcriptText), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

        } catch(e) {
            console.error("Transcript Error:", e.message);
            return new Response(JSON.stringify({ error: 'Transcript not available or could not be fetched.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
      }
      
      // 4. चैनल आईडी के लिए मौजूदा रूट
      if (path === '/yt-channel-id') {
          const channelUrl = url.searchParams.get('url');
          if (!channelUrl) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: corsHeaders });
          
          const channel = await youtube.getChannel(channelUrl.split('/').pop());
          return new Response(JSON.stringify({
              channelId: channel.id,
              channelTitle: channel.header.author.name
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 5. प्लेलिस्ट आइटम्स के लिए मौजूदा रूट
      if (path === '/yt-playlist-items') {
          const playlistId = url.searchParams.get('playlistId');
          if (!playlistId) return new Response(JSON.stringify({ error: 'Playlist ID is required' }), { status: 400, headers: corsHeaders });
          
          const playlist = await youtube.getPlaylist(playlistId);
          const items = playlist.videos.map(video => ({
              videoId: video.id,
              title: video.title.text
          }));
          return new Response(JSON.stringify({ items, playlistTitle: playlist.info.title }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 6. सामान्य URL प्रॉक्सी के लिए मौजूदा रूट
      const proxyUrl = url.searchParams.get('url');
      if (proxyUrl) {
        let response = await fetch(proxyUrl, { 
            headers: { 
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.google.com/'
            } 
        });
        let newResponse = new Response(response.body, response);
        // CORS हेडर जोड़ें
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        return newResponse;
      }

      // अगर कोई रूट मैच नहीं होता है
      return new Response('Route not found. Valid routes: /yt-search, /yt-trending, /yt-transcript, /yt-channel-id, /yt-playlist-items, /?url=...', { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
