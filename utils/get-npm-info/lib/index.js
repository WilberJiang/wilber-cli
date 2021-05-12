"use strict";

const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");

async function getNpmInfo(npmName, registry) {
  if (!npmName) return null;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios
    .get(npmInfoUrl)
    .then((resp) => {
      if (resp.status === 200) {
        return resp.data;
      } else {
        return null;
      }
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function getDefaultRegistry(isOrigin = false) {
  return isOrigin
    ? "http://registry.npmjs.org/"
    : "http://registry.npm.taobao.org/";
}

async function getNpmVersion(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    const r = Object.keys(data.versions);
    return r;
  } else {
    return [];
  }
}

function getSemverVersion(baseVersion, versionList) {
  return versionList
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a));
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versionList = await getNpmVersion(npmName, registry);
  const newVersions = getSemverVersion(baseVersion, versionList);
  if (newVersions && newVersions.length) return newVersions[0];
  return;
}

async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersion(npmName, registry);
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0];
  }
  return null;
}

module.exports = {
  getNpmInfo,
  getNpmVersion,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion,
};
