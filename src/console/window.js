'use strict';

exports.ConsoleWindowF12 = () => {
    konsol = {};

    //konsol authentikasi / login
    konsol.statusLogin = window.require('WAWebSocketModel').Socket;
    konsol.codePairingApi = window.require('WAWebAltDeviceLinkingApi');

    // User
    konsol.user = window.require('WAWebUserPrefsMeUser');

    // Connection
    konsol.koneksi = window.require('WAWebConnModel').Conn;
    konsol.cmd = window.require('WAWebCmd').Cmd;

    // Loading progress
    konsol.offlineHandler = window.require('WAWebOfflineHandler').OfflineMessageHandler;

    //konsol mengirim pesan
    konsol.Store = window.require('WAWebCollections');
    konsol.widFactory = window.require('WAWebWidFactory');
    konsol.findChat = window.require('WAWebFindChatAction');
    konsol.msgKey = window.require('WAWebMsgKey');
    konsol.EphemeralFields = window.require('WAWebGetEphemeralFieldsMsgActionsUtils');

    //konsol menerima pesan
    konsol.pesanMasuk = konsol.Store.Msg;

    //konsol mengirim file
    konsol.OpaqueData = window.require('WAWebMediaOpaqueData');
    konsol.prepRawMedia = window.require('WAWebPrepRawMedia');
    konsol.MediaStorage = window.require('WAWebMediaStorage');
    konsol.MediaType = window.require('WAWebMmsMediaTypes');
    konsol.MediaDataUtils = window.require('WAWebMediaDataUtils');
    konsol.MediaInMemoryBlobCache = window.require('WAWebMediaInMemoryBlobCache').InMemoryMediaBlobCache;
    konsol.MediaMmsV4Upload = window.require('WAWebMediaMmsV4Upload');

    konsol.mediaInfoToFile = ({ data, mimetype, filename }) => {
        const binaryData = window.atob(data);

        const buffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: mimetype });
        return new File([blob], filename, {
            type: mimetype,
            lastModified: Date.now(),
        });
    };

    konsol.processMediaData = async (
        mediaInfo,
        {
            forceSticker,
            forceDocument,
            forceMediaHd,
        },
    ) => {
        const file = konsol.mediaInfoToFile(mediaInfo);
        const OpaqueData = konsol.OpaqueData;
        const opaqueData = await OpaqueData.createFromData(
            file,
            mediaInfo.mimetype,
        );
        const mediaParams = {
            asSticker: forceSticker,
            asDocument: forceDocument,
        };

        if (forceMediaHd && file.type.indexOf('image/') === 0) {
            mediaParams.maxDimension = 2560;
        }

        const mediaPrep = konsol.prepRawMedia.prepRawMedia(opaqueData, mediaParams);
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = konsol.MediaStorage.getOrCreateMediaObject(mediaData.filehash);
        const mediaType = konsol.MediaType.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif,
            isNewsletter: false,
        });

        if (!mediaData.filehash) {
            throw new Error('media-fault: sendToChat filehash undefined');
        }

        if (!(mediaData.mediaBlob instanceof OpaqueData)) {
            mediaData.mediaBlob = await OpaqueData.createFromData(
                mediaData.mediaBlob,
                mediaData.mediaBlob.type,
            );
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());

        mediaData.mediaBlob.autorelease();
        const shouldUseMediaCache = konsol.MediaDataUtils.shouldUseMediaCache(
            konsol.MediaType.castToV4(mediaObject.type),
        );
        if (shouldUseMediaCache && mediaData.mediaBlob instanceof OpaqueData) {
            const formData = mediaData.mediaBlob.formData();
            konsol.MediaInMemoryBlobCache.put(mediaObject.filehash, formData);
        }

        const dataToUpload = {
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType,
        };

        const { uploadMedia, uploadUnencryptedMedia } = konsol.MediaMmsV4Upload;;
        const uploadedMedia = await uploadMedia(dataToUpload);

        const mediaEntry = uploadedMedia.mediaEntry;
        if (!mediaEntry) {
            throw new Error('upload failed: media entry was not created');
        }

        mediaData.set({
            clientUrl: mediaEntry.mmsUrl,
            deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
            directPath: mediaEntry.directPath,
            mediaKey: mediaEntry.mediaKey,
            mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
            filehash: mediaObject.filehash,
            encFilehash: mediaEntry.encFilehash,
            uploadhash: mediaEntry.uploadHash,
            size: mediaObject.size,
            streamingSidecar: mediaEntry.sidecar,
            firstFrameSidecar: mediaEntry.firstFrameSidecar,
            mediaHandle: null,
        });

        return mediaData;
    };

    konsol.processStickerData = async (mediaInfo) => {
        // if (mediaInfo.mimetype !== 'image/webp')
        //     throw new Error('Invalid media type');

        // const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        // let filehash = await window.WWebJS.getFileHash(file);
        // let mediaKey = await window.WWebJS.generateHash(32);

        // const controller = new AbortController();
        // const uploadedInfo = await window
        //     .require('WAWebUploadManager')
        //     .encryptAndUpload({
        //         blob: file,
        //         type: 'sticker',
        //         signal: controller.signal,
        //         mediaKey,
        //         uploadQpl: window
        //             .require('WAWebStartMediaUploadQpl')
        //             .startMediaUploadQpl({
        //                 entryPoint: 'MediaUpload',
        //             }),
        //     });

        // const stickerInfo = {
        //     ...uploadedInfo,
        //     clientUrl: uploadedInfo.url,
        //     deprecatedMms3Url: uploadedInfo.url,
        //     uploadhash: uploadedInfo.encFilehash,
        //     size: file.size,
        //     type: 'sticker',
        //     filehash,
        // };

        // return stickerInfo;
    };
};