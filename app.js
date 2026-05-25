import { supabase } from "./supabase.js";

/* =========================
   상태 관리
========================= */

/* 게시글 */
let posts = [];

/* 체크 선택 */
let selectedIds = [];

/* 수정중 ID */
let editingId = null;

/* 기존 이미지 유지 */
let existingImages = {

    after: [],

    before: [],

    regular: []
};

/* 팝업 이미지 */
let currentImages = [];

/* 현재 이미지 번호 */
let currentIndex = 0;

/* 줌 */
let zoomLevel = 1;

/* =========================
   🔥 페이지네이션
========================= */

/* 현재 페이지 */
let currentPage = 1;

/* 한 페이지 게시글 수 */
const POSTS_PER_PAGE = 15;

/* =========================
   화면 전환
========================= */

function showForm(){

    document
        .getElementById("formView")
        .classList
        .add("active");

    document
        .getElementById("listView")
        .classList
        .remove("active");
}

function showList(){

    document
        .getElementById("listView")
        .classList
        .add("active");

    document
        .getElementById("formView")
        .classList
        .remove("active");
}

/* =========================
   새 글
========================= */
function openNewPost(){

    editingId = null;

    selectedIds = [];

    clearForm();

    showForm();
}

/* =========================
   체크박스
========================= */
function toggleSelect(id, event){

    if(event.target.checked){

        if(!selectedIds.includes(id)){

            selectedIds.push(id);
        }

    } else {

        selectedIds =
            selectedIds.filter(
                x => x !== id
            );
    }
}

/* =========================
   수정 폼
========================= */
function openEditForm(){

    if(selectedIds.length !== 1){

        alert("수정은 1개만 선택");

        return;
    }

    const id = selectedIds[0];

    const post =
        posts.find(
            p => p.id === id
        );

    if(!post){

        alert("데이터 없음");

        return;
    }

    editingId = id;

    document.getElementById("date").value =
        post.date || "";

    document.getElementById("stock").value =
        post.stock || "";

    document.getElementById("after").value =
        post.after || "";

    document.getElementById("before").value =
        post.before || "";

    document.getElementById("regular").value =
        post.regular || "";

    document.getElementById("period").value =
        post.period || "";

    document.getElementById("note").value =
        post.note || "";

    existingImages = {

        after:
            post.after_urls || [],

        before:
            post.before_urls || [],

        regular:
            post.regular_urls || []
    };

    showForm();
}

/* =========================
   삭제
========================= */
async function deleteSelectedPosts(){

    if(selectedIds.length === 0){

        alert("선택 없음");

        return;
    }

    await supabase

        .from("posts")

        .delete()

        .in(
            "id",
            selectedIds
        );

    selectedIds = [];

    loadPosts();
}

/* =========================
   게시글 이동
========================= */

async function movePostUp(){

    if(selectedIds.length !== 1){

        alert("1개만 선택");

        return;
    }

    const current =
        posts.find(
            p => p.id === selectedIds[0]
        );

    const currentIndex =
        posts.findIndex(
            p => p.id === current.id
        );

    if(currentIndex <= 0)
        return;

    const target =
        posts[currentIndex - 1];

    await swapOrder(current, target);

    loadPosts();
}

async function movePostDown(){

    if(selectedIds.length !== 1){

        alert("1개만 선택");

        return;
    }

    const current =
        posts.find(
            p => p.id === selectedIds[0]
        );

    const currentIndex =
        posts.findIndex(
            p => p.id === current.id
        );

    if(currentIndex >= posts.length - 1)
        return;

    const target =
        posts[currentIndex + 1];

    await swapOrder(current, target);

    loadPosts();
}

/* 순서 교환 */
async function swapOrder(a, b){

    const temp = a.order_num;

    await supabase

        .from("posts")

        .update({
            order_num: b.order_num
        })

        .eq("id", a.id);

    await supabase

        .from("posts")

        .update({
            order_num: temp
        })

        .eq("id", b.id);
}

/* =========================
   이미지 업로드
========================= */
async function uploadImages(files){

    let urls = [];

    for(const file of files){

        const fileName =

            Date.now()
            + "_"
            + Math.random().toString(36);

        const { error } =

            await supabase

                .storage

                .from("images")

                .upload(
                    fileName,
                    file
                );

        if(error) continue;

        const { data } =

            supabase

                .storage

                .from("images")

                .getPublicUrl(fileName);

        urls.push(data.publicUrl);
    }

    return urls;
}

/* =========================
   등록 + 수정
========================= */
async function addPost(){

    const date =
        document.getElementById("date").value;

    const stock =
        document.getElementById("stock").value;

    const afterVal =
        document.getElementById("after").value;

    const beforeVal =
        document.getElementById("before").value;

    const regularVal =
        document.getElementById("regular").value;

    const period =
        document.getElementById("period").value;

    const note =
        document.getElementById("note").value;

    const afterFiles =
        document.getElementById("afterImage").files;

    const beforeFiles =
        document.getElementById("beforeImage").files;

    const regularFiles =
        document.getElementById("regularImage").files;

    const afterURLs =

        afterFiles.length > 0

        ? await uploadImages(afterFiles)

        : existingImages.after;

    const beforeURLs =

        beforeFiles.length > 0

        ? await uploadImages(beforeFiles)

        : existingImages.before;

    const regularURLs =

        regularFiles.length > 0

        ? await uploadImages(regularFiles)

        : existingImages.regular;

    /* 수정 */
    if(editingId){

        await supabase

            .from("posts")

            .update({

                date,

                stock,

                after: afterVal,

                before: beforeVal,

                regular: regularVal,

                period,

                note,

                after_urls: afterURLs,

                before_urls: beforeURLs,

                regular_urls: regularURLs
            })

            .eq(
                "id",
                editingId
            );

        editingId = null;

        selectedIds = [];
    }

    /* 신규 */
    else {

        const nextOrder =

            posts.length > 0

            ? Math.max(
                ...posts.map(
                    p => p.order_num || 0
                )
            ) + 1

            : 1;

        await supabase

            .from("posts")

            .insert([{

                date,

                stock,

                after: afterVal,

                before: beforeVal,

                regular: regularVal,

                period,

                note,

                after_urls: afterURLs,

                before_urls: beforeURLs,

                regular_urls: regularURLs,

                order_num: nextOrder
            }]);
    }

    clearForm();

    loadPosts();

    showList();
}

/* =========================
   폼 초기화
========================= */
function clearForm(){

    [

        "date",

        "stock",

        "after",

        "before",

        "regular",

        "period",

        "note"

    ].forEach(id=>{

        document
            .getElementById(id)
            .value = "";
    });

    [

        "afterImage",

        "beforeImage",

        "regularImage"

    ].forEach(id=>{

        document
            .getElementById(id)
            .value = "";
    });

    existingImages = {

        after: [],

        before: [],

        regular: []
    };
}

/* =========================
   게시글 로드
========================= */
async function loadPosts(){

    const { data, error } =

        await supabase

            .from("posts")

            .select("*")

            .order(
                "order_num",
                {
                    ascending:true
                }
            );

    if(error){

        console.log(error);

        return;
    }

    posts = data || [];

    renderPosts();

    renderPagination();
}

/* =========================
   게시글 출력
========================= */
function renderPosts(){

    const tbody =
        document.getElementById("boardBody");

    tbody.innerHTML = "";

    /* 시작 위치 */
    const start =
        (currentPage - 1)
        * POSTS_PER_PAGE;

    /* 끝 위치 */
    const end =
        start + POSTS_PER_PAGE;

    /* 현재 페이지 게시글 */
    const currentPosts =
        posts.slice(start, end);

    currentPosts.forEach((post, index)=>{

        const realIndex =
            start + index;

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>

                <input
                    type="checkbox"

                    onchange="
                        toggleSelect(
                            ${post.id},
                            event
                        )
                    ">

            </td>

            <td>
                ${post.date || ""}
            </td>

            <td>
                ${post.stock || ""}
            </td>

            <td
                class="clickable"

                onclick="
                    openSlider(
                        'after',
                        ${realIndex}
                    )
                ">

                ${post.after || ""}

            </td>

            <td
                class="clickable"

                onclick="
                    openSlider(
                        'before',
                        ${realIndex}
                    )
                ">

                ${post.before || ""}

            </td>

            <td
                class="clickable"

                onclick="
                    openSlider(
                        'regular',
                        ${realIndex}
                    )
                ">

                ${post.regular || ""}

            </td>

            <td>
                ${post.period || ""}
            </td>

            <td>
                ${post.note || ""}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* =========================
   페이지 버튼 생성
========================= */
function renderPagination(){

    const pagination =
        document.getElementById("pagination");

    pagination.innerHTML = "";

    const totalPages = Math.ceil(
        posts.length / POSTS_PER_PAGE
    );

    for(let i=1; i<=totalPages; i++){

        const button =
            document.createElement("button");

        button.innerText = i;

        button.classList.add("pageButton");

        if(i === currentPage){

            button.classList.add("active");
        }

        button.onclick = ()=>{

            currentPage = i;

            renderPosts();

            renderPagination();
        };

        pagination.appendChild(button);
    }
}

/* =========================
   슬라이더
========================= */
function openSlider(type, index){

    const post = posts[index];

    let images = [];

    if(type === "after")
        images = post.after_urls;

    if(type === "before")
        images = post.before_urls;

    if(type === "regular")
        images = post.regular_urls;

    currentImages = images || [];

    currentIndex = 0;

    if(currentImages.length === 0){

        alert("이미지 없음");

        return;
    }

    zoomLevel = 1;

    document
        .getElementById("popup")
        .classList
        .add("active");

    updateSlider();
}

/* 이미지 업데이트 */
function updateSlider(){

    document
        .getElementById("popupImage")
        .src =

            currentImages[currentIndex];

    document
        .getElementById("imageCounter")
        .innerText =

            `${currentIndex+1}
            /
            ${currentImages.length}`;

    zoomLevel = 1;

    applyZoom();
}

/* 줌 */
function applyZoom(){

    document
        .getElementById("popupImage")
        .style
        .transform =

            `scale(${zoomLevel})`;
}

/* 휠 줌 */
function handleWheelZoom(event){

    event.preventDefault();

    zoomLevel +=

        event.deltaY < 0

        ? 0.1

        : -0.1;

    if(zoomLevel < 1)
        zoomLevel = 1;

    if(zoomLevel > 5)
        zoomLevel = 5;

    applyZoom();
}

/* 다음 이미지 */
function nextImage(){

    if(
        currentIndex
        <
        currentImages.length - 1
    ){

        currentIndex++;

        updateSlider();
    }
}

/* 이전 이미지 */
function prevImage(){

    if(currentIndex > 0){

        currentIndex--;

        updateSlider();
    }
}

/* 팝업 닫기 */
function closePopup(){

    document
        .getElementById("popup")
        .classList
        .remove("active");
}

/* =========================
   최초 실행
========================= */
window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        showList();

        loadPosts();

        document

            .getElementById("popup")

            .addEventListener(
                "wheel",
                handleWheelZoom,
                {
                    passive:false
                }
            );
    }
);

/* =========================
   전역 연결
========================= */

window.showForm = showForm;

window.showList = showList;

window.addPost = addPost;

window.deleteSelectedPosts =
    deleteSelectedPosts;

window.toggleSelect =
    toggleSelect;

window.openNewPost =
    openNewPost;

window.openEditForm =
    openEditForm;

window.movePostUp =
    movePostUp;

window.movePostDown =
    movePostDown;

window.openSlider =
    openSlider;

window.nextImage =
    nextImage;

window.prevImage =
    prevImage;

window.closePopup =
    closePopup;